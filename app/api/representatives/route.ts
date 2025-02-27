import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";

    const representatives = await prisma.representative.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { area: { contains: search, mode: "insensitive" } },
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sales: {
          where: {
            OR: [
              {
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
                },
              },
              {
                createdAt: {
                  gte: new Date(new Date().setDate(1)), // This month
                },
              },
            ],
          },
          select: {
            total: true,
            createdAt: true,
          },
        },
      },
    });

    const total = await prisma.representative.count({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { area: { contains: search, mode: "insensitive" } },
        ],
      },
    });

    // Calculate sales totals
    const representativesWithSales = representatives.map((rep) => ({
      ...rep,
      todaySales: rep.sales
        .filter(
          (sale) => sale.createdAt >= new Date(new Date().setHours(0, 0, 0, 0))
        )
        .reduce((sum, sale) => sum + sale.total, 0),
      monthSales: rep.sales
        .filter((sale) => sale.createdAt >= new Date(new Date().setDate(1)))
        .reduce((sum, sale) => sum + sale.total, 0),
    }));

    return NextResponse.json({
      representatives: representativesWithSales,
      total,
    });
  } catch (error) {
    console.error("[REPRESENTATIVES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

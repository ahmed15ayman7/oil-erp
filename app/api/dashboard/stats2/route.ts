import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [customersCount, suppliersCount, productsCount, todaySales] =
      await Promise.all([
        prisma.customer.count(),
        prisma.supplier.count(),
        prisma.product.count(),
        prisma.sale.aggregate({
          where: {
            createdAt: {
              gte: today,
            },
          },
          _sum: {
            total: true,
          },
        }),
      ]);

    return NextResponse.json({
      customers: customersCount,
      suppliers: suppliersCount,
      products: productsCount,
      sales: todaySales._sum.total || 0,
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
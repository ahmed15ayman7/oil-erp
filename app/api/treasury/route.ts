import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import{Prisma} from "@prisma/client"
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { description: { contains: search, mode: Prisma.QueryMode.insensitive  } },
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.transaction.count({
      where: {
        OR: [
          { description: { contains: search, mode: Prisma.QueryMode.insensitive  } },
        ],
      },
    });

    // Calculate running balance
    let balance = 0;
    const transactionsWithBalance = transactions.map((transaction) => {
      balance +=
        transaction.type === "SALE_PAYMENT" 
          ? transaction.amount
          : -transaction.amount;
      return {
        ...transaction,
        balance,
      };
    });

    return NextResponse.json({ transactions: transactionsWithBalance, total });
  } catch (error) {
    console.error("[TREASURY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const transaction = await prisma.transaction.create({
      data: {
        ...body,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("[TREASURY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

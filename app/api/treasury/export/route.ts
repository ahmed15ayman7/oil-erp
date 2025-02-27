import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[TREASURY_EXPORT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

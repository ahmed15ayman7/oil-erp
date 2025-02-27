import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("[ASSETS_EXPORT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

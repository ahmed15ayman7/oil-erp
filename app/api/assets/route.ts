import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { AssetType, Prisma } from "@prisma/client";
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

    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            type: {
              equals: search as AssetType,
            },
          },
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.asset.count({
      where: {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            type: {
              equals: search as AssetType,
            },
          },
        ],
      },
    });

    return NextResponse.json({ assets, total });
  } catch (error) {
    console.error("[ASSETS_GET]", error);
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
    const asset = await prisma.asset.create({
      data: {
        ...body,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("[ASSETS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const asset = await prisma.asset.update({
      where: { id: body.id },
      data: body,
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("[ASSETS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing id", { status: 400 });
    }

    const asset = await prisma.asset.delete({
      where: { id },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("[ASSETS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { AssetType, Prisma, TransactionType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
           
          ],
        }
      : {};

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.asset.count({ where }),
    ]);

    // حساب الإحصائيات
    const stats = await prisma.$transaction([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "ACTIVE" } }),
      prisma.asset.count({ where: { status: "MAINTENANCE" } }),
      prisma.asset.count({ where: { status: "INACTIVE" } }),
      prisma.asset.aggregate({
        _sum: { value: true },
        where: { status: "ACTIVE" },
      }),
    ]);

    return NextResponse.json({
      assets,
      total,
      stats: {
        total: stats[0],
        active: stats[1],
        maintenance: stats[2],
        inactive: stats[3],
        totalValue: stats[4]._sum.value || 0,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/assets:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, type, value, purchaseDate, nextMaintenance, status, maxMaterials } = body;

    // بدء المعاملة
    const result = await prisma.$transaction(async (tx) => {
      // 1. إنشاء الأصل
      const asset = await tx.asset.create({
        data: {
          name,
          type,
          value: parseFloat(value),
          maxMaterials: parseFloat(maxMaterials),
          purchaseDate: new Date(purchaseDate),
          nextMaintenance:  new Date(nextMaintenance) ,
          status,
          user: {
            connect: {
              id: session.user.id,
            },
          },
        },
      });

      // 2. إنشاء معاملة مالية في الخزينة
      const transaction = await tx.transaction.create({
        data: {
          type: "ASSET_PURCHASE" as TransactionType,
          amount: -value, // قيمة سالبة لأنها مصروفات
          description: `شراء أصل: ${name}`,
          reference: asset.id,
          referenceType: "ASSET",
          asset: {
            connect: {
              id: asset.id,
            },
          },
          user: {
            connect: {
              id: session.user.id,
            },
          },
        },
      });

      return asset;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ASSETS_POST]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الأصل" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;
    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error in PUT /api/assets:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الأصل" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "معرف الأصل مطلوب" },
        { status: 400 }
      );
    }

    // بدء المعاملة
    await prisma.$transaction(async (tx) => {
      // 1. حذف المعاملات المالية المرتبطة
      await tx.transaction.deleteMany({
        where: {
          assetId: id,
        },
      });

      // 2. حذف الأصل
      await tx.asset.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ASSETS_DELETE]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الأصل" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "معرف الأصل مطلوب" },
        { status: 400 }
      );
    }

    // بدء المعاملة
    const result = await prisma.$transaction(async (tx) => {
      // 1. تحديث الأصل
      const asset = await tx.asset.update({
        where: { id },
        data: {
          ...data,
          nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null,
        },
      });

      // 2. إذا تم تغيير القيمة، قم بإنشاء معاملة مالية جديدة
      if (data.value !== undefined) {
        const oldAsset = await tx.asset.findUnique({
          where: { id },
        });

        if (oldAsset && oldAsset.value !== data.value) {
          await tx.transaction.create({
            data: {
              type: "ASSET_VALUE_CHANGE" as TransactionType,
              amount: oldAsset.value - data.value, // الفرق بين القيمة القديمة والجديدة
              description: `تعديل قيمة الأصل: ${asset.name}`,
              reference: asset.id,
              referenceType: "ASSET",
              asset: {
                connect: {
                  id: asset.id,
                },
              },
              user: {
                connect: {
                  id: session.user.id,
                },
              },
            },
          });
        }
      }

      return asset;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ASSETS_PATCH]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الأصل" },
      { status: 500 }
    );
  }
}

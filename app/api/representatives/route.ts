import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaTimeout } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, TransactionType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // حساب الإحصائيات
    const [total, active, onLeave, inactive] = await Promise.all([
      prisma.representative.count(),
      prisma.representative.count({ where: { status: "ACTIVE" } }),
      prisma.representative.count({ where: { status: "ON_LEAVE" } }),
      prisma.representative.count({ where: { status: "INACTIVE" } }),
    ]);

    // البحث في المندوبين
    const representatives = await prisma.representative.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { area: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // حساب إجمالي النتائج للبحث
    const totalSearch = await prisma.representative.count({
      where: {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { area: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      },
    });

    return NextResponse.json({
      representatives,
      total: totalSearch,
      stats: {
      total,
        active,
        onLeave,
        inactive,
      },
    });
  } catch (error) {
    console.error("Error fetching representatives:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, area, deliveryFee, status } = body;

    // بدء المعاملة
    const result = await prismaTimeout( prisma.$transaction(async (tx) => {
      // 1. إنشاء المندوب
      const representative = await tx.representative.create({
        data: {
          name,
          phone,
          area,
          deliveryFee,
          status,
          user: { connect: { id: session.user.id } },
        },
      });

      // 2. إنشاء معاملة مالية في الخزينة إذا كان هناك عمولة توصيل مدفوعة مقدماً
      if (deliveryFee > 0) {
        await tx.transaction.create({
          data: {
            type: "DELIVERY_FEE_ADVANCE" as TransactionType,
            amount: -deliveryFee,
            description: `عمولة توصيل مقدمة للمندوب: ${name}`,
            reference: representative.id,
            referenceType: "REPRESENTATIVE",
            representativeId: representative.id,
            createdBy: session.user.id,
          },
        });
      }

      return representative;
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[REPRESENTATIVES_POST]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المندوب" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    const representative = await prisma.representative.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(representative);
  } catch (error) {
    console.error("Error updating representative:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث بيانات المندوب" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "معرف المندوب مطلوب" },
        { status: 400 }
      );
    }

    // بدء المعاملة
    await prisma.$transaction(async (tx) => {
      // 1. حذف المعاملات المالية المرتبطة
      await tx.transaction.deleteMany({
        where: {
          representativeId: id,
        },
      });

      // 2. حذف المندوب
      await tx.representative.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REPRESENTATIVES_DELETE]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المندوب" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "معرف المندوب مطلوب" },
        { status: 400 }
      );
    }

    // بدء المعاملة
    const result = await prisma.$transaction(async (tx) => {
      // 1. تحديث المندوب
      const representative = await tx.representative.update({
        where: { id },
        data,
      });

      // 2. إذا تم تغيير عمولة التوصيل، قم بإنشاء معاملة مالية جديدة
      if (data.deliveryFee !== undefined) {
        const oldRep = await tx.representative.findUnique({
          where: { id },
        });

        if (oldRep && oldRep.deliveryFee !== data.deliveryFee) {
          await tx.transaction.create({
            data: {
              type: "DELIVERY_FEE_CHANGE" as TransactionType,
              amount: oldRep.deliveryFee - data.deliveryFee, // الفرق بين العمولة القديمة والجديدة
              description: `تعديل عمولة التوصيل للمندوب: ${representative.name}`,
              reference: representative.id,
              referenceType: "REPRESENTATIVE",
              representativeId: representative.id,
              createdBy: session.user.id,
            },
          });
        }
      }

      return representative;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[REPRESENTATIVES_PATCH]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المندوب" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { materialId, productId, assetId, quantity, startTime, result } = body;

    // بدء المعاملة
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. إنشاء سجل الإنتاج
      const production = await tx.production.create({
        data: {
          materialId,
          productId,
          assetId,
          quantity,
          output: result.expectedOutput,
          startTime: new Date(startTime),
          status: "IN_PROGRESS",
          createdBy: session.user.id,
        },
      });

      // 2. تحديث كمية المادة الخام
      await tx.material.update({
        where: { id: materialId },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      // 3. إنشاء معاملة للمادة الخام
      await tx.materialTransaction.create({
        data: {
          materialId,
          type: "OUT",
          quantity: quantity,
          reference: `PROD-${production.id}`,
          notes: "تحويل إلى منتج نهائي",
          createdBy: session.user.id,
        },
      });

      // 4. تحديث كمية المنتج النهائي
      await tx.product.update({
        where: { id: productId },
        data: {
          quantity: {
            increment: result.expectedOutput,
          },
        },
      });

      // 5. إنشاء حركة مخزون للمنتج النهائي
      await tx.stockMovement.create({
        data: {
          productId,
          type: "ADJUSTMENT",
          quantity: result.expectedOutput,
          reference: `PROD-${production.id}`,
          notes: "إنتاج جديد",
          userId: session.user.id,
        },
      });

      return production;
    });

    return NextResponse.json({
      success: true,
      message: "تم تسجيل عملية الإنتاج بنجاح",
      productionId: transaction.id,
    });
  } catch (error) {
    console.error("[MATERIALS_CONVERT_CONFIRM]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تأكيد عملية التحويل" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return new NextResponse("Method not allowed", { status: 405 });
} 
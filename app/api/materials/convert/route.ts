import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { MaterialType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { materialId, productId, assetId, quantity, startTime } = body;

    // التحقق من وجود المادة الخام والمنتج والأصل
    const [material, product, asset] = await Promise.all([
      prisma.material.findUnique({ where: { id: materialId } }),
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.asset.findUnique({ where: { id: assetId } }),
    ]);

    if (!material || !product || !asset) {
      return NextResponse.json(
        { error: "لم يتم العثور على المادة الخام أو المنتج أو الأصل" },
        { status: 404 }
      );
    }

    // التحقق من توفر الكمية المطلوبة
    if (material.quantity < quantity) {
      return NextResponse.json(
        { error: "الكمية المتوفرة غير كافية" },
        { status: 400 }
      );
    }

    let [BOTTLE, CARTON, BOTTLE_CAP,SLEEVE,TAPE] =await Promise.all([
      prisma.material.findFirst({ where: { type: MaterialType.BOTTLE },select:{quantity:true,minQuantity:true} }),
      prisma.material.findFirst({ where: { type: MaterialType.CARTON },select:{quantity:true,minQuantity:true} }),
      prisma.material.findFirst({ where: { type: MaterialType.BOTTLE_CAP },select:{quantity:true,minQuantity:true} }),
      prisma.material.findFirst({ where: { type: MaterialType.SLEEVE },select:{quantity:true,minQuantity:true} }),
      prisma.material.findFirst({ where: { type: MaterialType.TAPE },select:{quantity:true,minQuantity:true} }),
    ])
    // حساب نتائج التحويل (هذه القيم يجب تعديلها حسب معادلات التحويل الخاصة بك)
    const conversionResult = {
      bottles: Math.floor(quantity * 1000), // مثال: كل طن ينتج 1000 زجاجة
      avialableBottles:+ (BOTTLE?.quantity || 0)-((BOTTLE?.minQuantity || 0)) >= Math.floor(quantity * 1000),
      cartons: Math.ceil((quantity * 1000) / 12),
      avialableCartons:+ (CARTON?.quantity || 0)-((CARTON?.minQuantity || 0)) >= Math.ceil((quantity * 1000) / 12),
      caps: Math.floor(quantity * 1000),
      avialableCaps:+ (BOTTLE_CAP?.quantity || 0)-((BOTTLE_CAP?.minQuantity || 0)) >= Math.floor(quantity * 1000),
      sleeves: Math.floor(quantity * 1000),
      avialableSleeves:+ (SLEEVE?.quantity || 0)-((SLEEVE?.minQuantity || 0)) >= Math.floor(quantity * 1000),
      stickers: Math.floor(quantity * 1000),
      avialableStickers:+ (TAPE?.quantity || 0)-((TAPE?.minQuantity || 0)) >= Math.floor(quantity * 1000),
      expectedOutput: quantity * 1000, // الناتج المتوقع بالزجاجات
    };
    return NextResponse.json(conversionResult);
  } catch (error) {
    console.error("[MATERIALS_CONVERT]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء عملية التحويل" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return new NextResponse("Method not allowed", { status: 405 });
} 
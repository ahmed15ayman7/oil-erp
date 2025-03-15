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

    // حساب نتائج التحويل (هذه القيم يجب تعديلها حسب معادلات التحويل الخاصة بك)
    const conversionResult = {
      bottles: Math.floor(quantity * 1000), // مثال: كل طن ينتج 1000 زجاجة
      cartons: Math.ceil((quantity * 1000) / 12), // مثال: كل 12 زجاجة في كرتونة
      caps: Math.floor(quantity * 1000), // غطاء لكل زجاجة
      sleeves: Math.floor(quantity * 1000), // سليف لكل زجاجة
      stickers: Math.floor(quantity * 1000), // استيكر لكل زجاجة
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
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await getAuthSession();
    const data = await request.json();
    const { materialId, productId, quantity } = data;

    // Get the product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new Error('المنتج غير موجود');
    }

    // Convert tons to kilograms
    const quantityInKg = quantity * 1000;
    // Calculate bottles based on product weight (e.g., 900g)
    const bottleWeight = ((product.category.value  || 900) -62.5) / 1000 ;
    // 900g in kg
    const totalBottles = Math.floor(quantityInKg / bottleWeight);
    // Calculate cartons (12 bottles per carton)
    const bottlesPerCarton = 12;
    const totalCartons = Math.ceil(totalBottles / bottlesPerCarton);

    // Each bottle needs 1 cap, 1 sleeve, and 1 sticker
    const totalCaps = totalBottles;
    const totalSleeves = totalBottles;
    const totalStickers = totalBottles;

    return successResponse({
      bottles: totalBottles,
      cartons: totalCartons,
      caps: totalCaps,
      sleeves: totalSleeves,
      stickers: totalStickers,
    });

  } catch (error) {
    return handleApiError(error);
  }
} 
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-response';
import { MaterialType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const data = await request.json();
    const { materialId, productId, quantity, result } = data;

    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Deduct raw material
      await tx.material.update({
        where: { id: materialId },
        data: {
          quantity: {
            decrement: quantity * 1000 // Convert tons to kg
          },
          transactions: {
            create: {
              type: 'OUT',
              quantity: quantity * 1000,
              notes: `تحويل إلى منتج ${productId}`,
              createdBy: session.user.id,
            }
          }
        }
      });

      // Update inventory for bottles, caps, sleeves, etc.
      const materialsToUpdate = [
        { type: 'BOTTLE', quantity: result.bottles },
        { type: 'BOTTLE_CAP', quantity: result.caps },
        { type: 'SLEEVE', quantity: result.sleeves },
        { type: 'CARTON', quantity: result.cartons },
      ];

      for (const item of materialsToUpdate) {
        await tx.material.updateMany({
          where: { type: item.type as MaterialType },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      // Add the finished product
      await tx.product.update({
        where: { id: productId },
        data: {
          quantity: {
            increment: result.bottles
          }
        }
      });
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
} 
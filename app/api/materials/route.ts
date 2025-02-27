import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-response';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await getAuthSession();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { supplier: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [materials, totalRows] = await Promise.all([
      prisma.material.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
      }),
      prisma.material.count({ where }),
    ]);

    // حساب حالة المخزون لكل مادة
    const materialsWithStatus = materials.map(material => {
      const status = material.quantity <= material.minQuantity 
        ? 'LOW_STOCK' 
        : material.quantity === 0 
          ? 'OUT_OF_STOCK' 
          : 'IN_STOCK';

      return {
        ...material,
        status,
        transactionsCount: material._count.transactions,
      };
    });

    return successResponse({
      materials: materialsWithStatus,
      totalRows,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();
    
    // التحقق من عدم تكرار الكود
    const existingMaterial = await prisma.material.findUnique({
      where: { code: data.code },
    });

    if (existingMaterial) {
      throw new Error('كود المادة مستخدم بالفعل');
    }

    const material = await prisma.material.create({
      data: {
        ...data,
        transactions: {
          create: {
            type: 'IN',
            quantity: data.quantity || 0,
            price: data.price,
            notes: 'رصيد افتتاحي',
            createdBy: 'SYSTEM',
          },
        },
      },
      include: {
        transactions: true,
      },
    });

    return successResponse(material);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();
    const { id, ...updateData } = data;

    // التحقق من عدم تكرار الكود
    const existingMaterial = await prisma.material.findFirst({
      where: { 
        code: updateData.code,
        NOT: { id },
      },
    });

    if (existingMaterial) {
      throw new Error('كود المادة مستخدم بالفعل');
    }

    // إذا تم تغيير الكمية، نقوم بإنشاء معاملة جديدة
    const currentMaterial = await prisma.material.findUnique({
      where: { id },
    });

    const material = await prisma.material.update({
      where: { id },
      data: {
        name: updateData.name,
        code: updateData.code,
        unit: updateData.unit,
        minQuantity: updateData.minQuantity,
        price: updateData.price,
        supplier: updateData.supplier,
        quantity: updateData.quantity,
        notes: updateData.notes,
        location: updateData.location,
        type: updateData.type,
      },
    });

    if (currentMaterial && currentMaterial.quantity !== updateData.quantity) {
      const difference = updateData.quantity - currentMaterial.quantity;
      await prisma.materialTransaction.create({
        data: {
          materialId: id,
          type: difference > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(difference),
          price: updateData.price,
          notes: 'تعديل الكمية',
          createdBy: 'SYSTEM',
        },
      });
    }

    return successResponse(material);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await getAuthSession();

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      throw new Error('معرف المادة مطلوب');
    }

    // التحقق من وجود معاملات مرتبطة
    const transactionsCount = await prisma.materialTransaction.count({
      where: { materialId: id },
    });

    if (transactionsCount > 0) {
      throw new Error('لا يمكن حذف المادة لوجود معاملات مرتبطة بها');
    }

    await prisma.material.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
} 
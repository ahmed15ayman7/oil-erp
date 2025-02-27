import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { ApiError } from '@/lib/api-error';
import { successResponse, handleApiError } from '@/lib/api-response';
import { Prisma, MovementType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await getAuthSession();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {
      AND: [
        productId ? { productId } : {},
        type ? { type: type as MovementType } : {},
        startDate && !isNaN(Date.parse(startDate)) ? { createdAt: { gte: new Date(startDate) } } : {},
        endDate && !isNaN(Date.parse(endDate)) ? { createdAt: { lte: new Date(endDate) } } : {},
      ],
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            include: {
              unit: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return successResponse({
      movements,
      total,
      page,
      limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    const data = await request.json();

    // Validate required fields
    if (!data.productId || !data.type || typeof data.quantity !== 'number') {
      return handleApiError(new ApiError('Missing required fields', 400));
    }

    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // Get current product
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new ApiError('Product not found', 404);
      }

      // Calculate new quantity
      let newQuantity = product.quantity;
      switch (data.type) {
        case 'PURCHASE':
        case 'RETURN':
          newQuantity += data.quantity;
          break;
        case 'SALE':
        case 'DAMAGE':
          newQuantity -= data.quantity;
          if (newQuantity < 0) {
            throw new ApiError('Insufficient stock', 400);
          }
          break;
        case 'ADJUSTMENT':
          newQuantity = data.quantity;
          break;
      }

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          ...data,
          userId: session.user.id,
        },
        include: {
          product: {
            include: {
              unit: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update product quantity and status
      await tx.product.update({
        where: { id: data.productId },
        data: {
          quantity: newQuantity,
          status: newQuantity <= 0 
            ? 'OUT_OF_STOCK'
            : newQuantity <= product.minQuantity
            ? 'LOW_STOCK'
            : 'IN_STOCK',
        },
      });

      return successResponse(movement);
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Export inventory to Excel
export async function PUT(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();
    const { type, category } = data;

    const where: Prisma.ProductWhereInput = {
      AND: [
        type ? { type } : {},
        category ? { categoryId: category } : {},
      ],
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        unit: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform data for Excel
    const excelData = products.map(product => ({
      'الكود': product.code,
      'الباركود': product.barcode || '',
      'اسم المنتج': product.name,
      'الفئة': product.category.name,
      'الوحدة': product.unit.name,
      'السعر': product.price,
      'الكمية الحالية': product.quantity,
      'الحد الأدنى': product.minQuantity,
      'الحد الأقصى': product.maxQuantity,
      'الحالة': getStatusText(product.status),
      'آخر حركة': product.stockMovements[0]?.createdAt 
        ? new Date(product.stockMovements[0].createdAt).toLocaleDateString('ar-EG')
        : '',
      'قيمة المخزون': product.quantity * product.price,
    }));

    return successResponse(excelData);
  } catch (error) {
    return handleApiError(error);
  }
}

// Import inventory from Excel
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();

    const data = await request.json();
    const { products } = data;

    if (!Array.isArray(products)) {
      return handleApiError(new ApiError('Invalid products data', 400));
    }

    // Update each product's quantity
    const updates = products.map(async (item: any) => {
      const product = await prisma.product.findUnique({
        where: { code: item.code },
      });

      if (!product) {
        throw new ApiError(`Product with code ${item.code} not found`, 404);
      }

      const difference = item.quantity - product.quantity;

      if (difference === 0) return null;

      return prisma.$transaction([
        // Create stock movement
        prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: 'ADJUSTMENT',
            quantity: difference,
            reference: 'Excel Import',
            notes: 'تحديث من ملف Excel',
            userId: session.user.id,
          },
        }),
        // Update product quantity
        prisma.product.update({
          where: { id: product.id },
          data: {
            quantity: item.quantity,
            status: item.quantity <= 0 
              ? 'OUT_OF_STOCK'
              : item.quantity <= product.minQuantity
              ? 'LOW_STOCK'
              : 'IN_STOCK',
          },
        }),
      ]);
    });

    await Promise.all(updates.filter(Boolean));

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    IN_STOCK: 'متوفر',
    LOW_STOCK: 'منخفض',
    OUT_OF_STOCK: 'نفذ',
  };
  return statusMap[status] || status;
}

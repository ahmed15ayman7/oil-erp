import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { ApiError } from '@/lib/api-error';
import { successResponse, handleApiError } from '@/lib/api-response';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await getAuthSession();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        } : {},
        category ? { categoryId: category } : {},
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          unit: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate stock value for each product
    const productsWithValue = products.map(product => ({
      ...product,
      stockValue: product.quantity * product.price,
    }));

    return successResponse({
      products: productsWithValue,
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
    await getAuthSession();

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.code || !data.price || !data.categoryId || !data.unitId) {
      return handleApiError(new ApiError('Missing required fields', 400));
    }

    // Check if product code already exists
    const existingProduct = await prisma.product.findUnique({
      where: { code: data.code },
    });

    if (existingProduct) {
      return handleApiError(new ApiError('Product with this code already exists', 400));
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return handleApiError(new ApiError('Category not found', 404));
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId },
    });

    if (!unit) {
      return handleApiError(new ApiError('Unit not found', 404));
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...data,
        quantity: data.quantity || 0,
        minQuantity: data.minQuantity || 0,
        maxQuantity: data.maxQuantity || 0,
      },
      include: {
        category: true,
        unit: true,
      },
    });

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return handleApiError(new ApiError('Product ID is required', 400));
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return handleApiError(new ApiError('Product not found', 404));
    }

    // Check if new code conflicts with another product
    if (updateData.code && updateData.code !== existingProduct.code) {
      const codeExists = await prisma.product.findFirst({
        where: {
          code: updateData.code,
          id: { not: id },
        },
      });

      if (codeExists) {
        return handleApiError(new ApiError('Product with this code already exists', 400));
      }
    }

    // Check if category exists if being updated
    if (updateData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });

      if (!category) {
        return handleApiError(new ApiError('Category not found', 404));
      }
    }

    // Check if unit exists if being updated
    if (updateData.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: updateData.unitId },
      });

      if (!unit) {
        return handleApiError(new ApiError('Unit not found', 404));
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        unit: true,
      },
    });

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await getAuthSession();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return handleApiError(new ApiError('Product ID is required', 400));
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        purchaseItems: true,
        saleItems: true,
      },
    });

    if (!product) {
      return handleApiError(new ApiError('Product not found', 404));
    }

    // Check if product is used in any purchase or sale
    if (product.purchaseItems.length > 0 || product.saleItems.length > 0) {
      return handleApiError(
        new ApiError(
          'Cannot delete product as it is used in purchases or sales',
          400
        )
      );
    }

    // Delete the product
    await prisma.product.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

// Bulk update product quantities
export async function PATCH(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();
    const { products } = data;

    if (!Array.isArray(products)) {
      return handleApiError(new ApiError('Invalid products data', 400));
    }

    // Update each product's quantity
    const updates = products.map(async (item: any) => {
      if (!item.id || typeof item.quantity !== 'number') {
        throw new ApiError('Invalid product data', 400);
      }

      return prisma.product.update({
        where: { id: item.id },
        data: { quantity: item.quantity },
      });
    });

    await Promise.all(updates);

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

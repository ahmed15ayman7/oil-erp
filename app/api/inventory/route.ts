import { prisma } from '@/lib/prisma';
import {
  handleApiError,
  successResponse,
  ApiError,
} from '@/lib/api-response';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return successResponse({ products, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.code || !data.type) {
      throw new ApiError('Missing required fields');
    }

    // Check if code already exists
    const existing = await prisma.product.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ApiError('code already exists');
    }

    const product = await prisma.product.create({
      data,
    });

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      throw new ApiError('Missing product ID');
    }

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError('Product not found');
    }

    // If code is being changed, check if new code already exists
    if (
      updateData.code &&
      updateData.code !== existing.code
    ) {
      const codeExists = await prisma.product.findUnique({
        where: { code: updateData.code },
      });

      if (codeExists) {
        throw new ApiError('code already exists');
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ApiError('Missing product ID');
    }

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError('Product not found');
    }

    await prisma.product.delete({
      where: { id },
    });

    return successResponse({ message: 'Product deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

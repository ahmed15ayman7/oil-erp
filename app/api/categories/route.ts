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
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ],
    };

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.count({ where }),
    ]);

    return successResponse({
      categories,
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
    if (!data.name) {
      return handleApiError(new ApiError('Missing required fields', 400));
    }

    // Check if category name already exists
    const existingCategory = await prisma.category.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });

    if (existingCategory) {
      return handleApiError(new ApiError('Category with this name already exists', 400));
    }

    // Create category
    const category = await prisma.category.create({
      data,
    });

    return successResponse(category);
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
      return handleApiError(new ApiError('Category ID is required', 400));
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return handleApiError(new ApiError('Category not found', 404));
    }

    // Check if new name conflicts with another category
    if (updateData.name && updateData.name !== existingCategory.name) {
      const nameExists = await prisma.category.findFirst({
        where: {
          name: { equals: updateData.name, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (nameExists) {
        return handleApiError(new ApiError('Category with this name already exists', 400));
      }
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return successResponse(category);
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
      return handleApiError(new ApiError('Category ID is required', 400));
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      return handleApiError(new ApiError('Category not found', 404));
    }

    // Check if category has products
    if (category.products.length > 0) {
      return handleApiError(
        new ApiError(
          'Cannot delete category as it has associated products',
          400
        )
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

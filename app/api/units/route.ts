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
        { symbol: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ],
    };

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
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
      prisma.unit.count({ where }),
    ]);

    return successResponse({
      units,
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
    if (!data.name || !data.symbol) {
      return handleApiError(new ApiError('Missing required fields', 400));
    }

    // Check if unit name or symbol already exists
    const existingUnit = await prisma.unit.findFirst({
      where: {
        OR: [
          { name: { equals: data.name, mode: 'insensitive' } },
          { symbol: { equals: data.symbol, mode: 'insensitive' } },
        ],
      },
    });

    if (existingUnit) {
      return handleApiError(new ApiError('Unit with this name or symbol already exists', 400));
    }

    // Create unit
    const unit = await prisma.unit.create({
      data,
    });

    return successResponse(unit);
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
      return handleApiError(new ApiError('Unit ID is required', 400));
    }

    // Check if unit exists
    const existingUnit = await prisma.unit.findUnique({
      where: { id },
    });

    if (!existingUnit) {
      return handleApiError(new ApiError('Unit not found', 404));
    }

    // Check if new name or symbol conflicts with another unit
    if (
      (updateData.name && updateData.name !== existingUnit.name) ||
      (updateData.symbol && updateData.symbol !== existingUnit.symbol)
    ) {
      const conflictExists = await prisma.unit.findFirst({
        where: {
          OR: [
            {
              name: { equals: updateData.name || existingUnit.name, mode: 'insensitive' },
              id: { not: id },
            },
            {
              symbol: { equals: updateData.symbol || existingUnit.symbol, mode: 'insensitive' },
              id: { not: id },
            },
          ],
        },
      });

      if (conflictExists) {
        return handleApiError(new ApiError('Unit with this name or symbol already exists', 400));
      }
    }

    // Update unit
    const unit = await prisma.unit.update({
      where: { id },
      data: updateData,
    });

    return successResponse(unit);
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
      return handleApiError(new ApiError('Unit ID is required', 400));
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!unit) {
      return handleApiError(new ApiError('Unit not found', 404));
    }

    // Check if unit has products
    if (unit.products.length > 0) {
      return handleApiError(
        new ApiError(
          'Cannot delete unit as it has associated products',
          400
        )
      );
    }

    // Delete the unit
    await prisma.unit.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

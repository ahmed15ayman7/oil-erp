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
            { location: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [warehouses, totalRows] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.warehouse.count({ where }),
    ]);

    return successResponse({
      warehouses: warehouses.map(warehouse => ({
        ...warehouse,
        itemsCount: warehouse._count.items,
      })),
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
    const warehouse = await prisma.warehouse.create({
      data,
    });

    return successResponse(warehouse);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();
    const { id, ...updateData } = data;

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: updateData,
    });

    return successResponse(warehouse);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await getAuthSession();

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      throw new Error('Missing warehouse ID');
    }

    await prisma.warehouse.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
} 
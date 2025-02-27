import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  handleApiError,
  successResponse,
  ApiError,
} from '@/lib/api-response';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

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
            { phone: { contains: search } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { taxNumber: { contains: search } },
          ],
        }
      : {};

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: {
              purchases: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    // Calculate balance and get last purchase date for each supplier
    const suppliersWithDetails = await Promise.all(
      suppliers.map(async (supplier) => {
        const [purchases, lastPurchase] = await Promise.all([
          prisma.purchase.findMany({
            where: { supplierId: supplier.id },
            select: { total: true },
          }),
          prisma.purchase.findFirst({
            where: { supplierId: supplier.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

        const balance = purchases.reduce(
          (sum, purchase) => sum + purchase.total,
          0
        );

        return {
          ...supplier,
          balance,
          lastPurchaseDate: lastPurchase?.createdAt || null,
        };
      })
    );

    return successResponse({
      suppliers: suppliersWithDetails,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      throw new ApiError('Unauthorized', 401);
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.phone ) {
      throw new ApiError('Missing required fields');
    }

    // Check if phone number is unique
    const existingSupplier = await prisma.supplier.findFirst({
      where: { phone: data.phone },
    });

    if (existingSupplier) {
      throw new ApiError('رقم الهاتف مستخدم بالفعل');
    }

    // Validate credit limit and period
    if (data.creditLimit < 0) {
      throw new ApiError('حد الائتمان يجب أن يكون أكبر من أو يساوي صفر');
    }

    if (data.creditPeriod < 0) {
      throw new ApiError('فترة الائتمان يجب أن تكون أكبر من أو تساوي صفر');
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...data,
      },
    });

    return successResponse(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      throw new ApiError('Unauthorized', 401);
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      throw new ApiError('Missing supplier ID');
    }

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      throw new ApiError('Supplier not found');
    }

    // Check if phone number is unique (excluding current supplier)
    const phoneExists = await prisma.supplier.findFirst({
      where: {
        phone: updateData.phone,
        NOT: { id },
      },
    });

    if (phoneExists) {
      throw new ApiError('رقم الهاتف مستخدم بالفعل');
    }

    // Validate credit limit and period
    if (updateData.creditLimit < 0) {
      throw new ApiError('حد الائتمان يجب أن يكون أكبر من أو يساوي صفر');
    }

    if (updateData.creditPeriod < 0) {
      throw new ApiError('فترة الائتمان يجب أن تكون أكبر من أو تساوي صفر');
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    return successResponse(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      throw new ApiError('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ApiError('Missing supplier ID');
    }

    // Check if supplier has any related purchases
    const supplierPurchases = await prisma.purchase.findFirst({
      where: { supplierId: id },
    });

    if (supplierPurchases) {
      throw new ApiError(
        'لا يمكن حذف المورد لوجود مشتريات مرتبطة به'
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return successResponse({ message: 'Supplier deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

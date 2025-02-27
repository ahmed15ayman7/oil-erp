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
    const status = searchParams.get('status') || undefined;

    const where = {
      AND: [
        {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { licenseNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        },
        status ? { status: status as any } : {},
      ],
    };

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: {
          vehicle: true,
          _count: {
            select: {
              deliveries: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driver.count({ where }),
    ]);

    return successResponse({
      drivers,
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
    if (!session) {
      return handleApiError(new ApiError('غير مصرح', 401));
    }

    const data = await request.json();

    // التحقق من البيانات المطلوبة
    if (!data.name || !data.phone || !data.licenseNumber) {
      return handleApiError(new ApiError('جميع الحقول مطلوبة', 400));
    }

    // التحقق من عدم تكرار رقم الرخصة
    const existingDriver = await prisma.driver.findFirst({
      where: {
        licenseNumber: data.licenseNumber,
      },
    });

    if (existingDriver) {
      return handleApiError(new ApiError('رقم الرخصة مستخدم بالفعل', 400));
    }

    const driver = await prisma.driver.create({
      data: {
        ...data,
        createdBy: session.user.id,
      },
    });

    return successResponse(driver);
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
      return handleApiError(new ApiError('معرف السائق مطلوب', 400));
    }

    // التحقق من وجود السائق
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return handleApiError(new ApiError('السائق غير موجود', 404));
    }

    // التحقق من عدم تكرار رقم الرخصة
    if (updateData.licenseNumber && updateData.licenseNumber !== existingDriver.licenseNumber) {
      const licenseExists = await prisma.driver.findFirst({
        where: {
          licenseNumber: updateData.licenseNumber,
          id: { not: id },
        },
      });

      if (licenseExists) {
        return handleApiError(new ApiError('رقم الرخصة مستخدم بالفعل', 400));
      }
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: updateData,
    });

    return successResponse(driver);
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
      return handleApiError(new ApiError('معرف السائق مطلوب', 400));
    }

    // التحقق من وجود السائق
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        deliveries: true,
      },
    });

    if (!driver) {
      return handleApiError(new ApiError('السائق غير موجود', 404));
    }

    // التحقق من عدم وجود عمليات تسليم مرتبطة
    if (driver.deliveries.length > 0) {
      return handleApiError(
        new ApiError('لا يمكن حذف السائق لوجود عمليات تسليم مرتبطة به', 400)
      );
    }

    await prisma.driver.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
} 
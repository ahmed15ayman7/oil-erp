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
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleWhereInput = {
      AND: [
        {
          OR: [
            { plateNumber: { contains: search } },
            { model: { contains: search } },
          ],
        },
        status ? { status: status as any } : {},
      ],
    };

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          expenses: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return successResponse({
      vehicles,
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
    if (!data.plateNumber || !data.model || !data.capacity) {
      return handleApiError(new ApiError('Missing required fields', 400));
    }

    // Check if plate number already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plateNumber: data.plateNumber },
    });

    if (existingVehicle) {
      return handleApiError(new ApiError('رقم اللوحة مسجل بالفعل', 400));
    }

    const vehicle = await prisma.vehicle.create({
      data,
      include: {
        expenses: true,
      },
    });

    return successResponse(vehicle);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();

    if (!data.id) {
      return handleApiError(new ApiError('Missing vehicle ID', 400));
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.id },
    });

    if (!vehicle) {
      return handleApiError(new ApiError('Vehicle not found', 404));
    }

    // Check if new plate number already exists
    if (data.plateNumber && data.plateNumber !== vehicle.plateNumber) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { plateNumber: data.plateNumber },
      });

      if (existingVehicle) {
        return handleApiError(new ApiError('رقم اللوحة مسجل بالفعل', 400));
      }
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: data.id },
      data,
      include: {
        expenses: true,
      },
    });

    return successResponse(updatedVehicle);
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
      return handleApiError(new ApiError('Missing vehicle ID', 400));
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return handleApiError(new ApiError('Vehicle not found', 404));
    }

    // Delete vehicle and its expenses
    await prisma.$transaction([
      prisma.vehicleExpense.deleteMany({
        where: { vehicleId: id },
      }),
      prisma.vehicle.delete({
        where: { id },
      }),
    ]);

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

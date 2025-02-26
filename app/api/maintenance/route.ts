import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { ApiError } from '@/lib/api-error';
import { successResponse, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await getAuthSession();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const vehicleId = searchParams.get('vehicleId');
    const skip = (page - 1) * limit;

    const where = vehicleId ? { vehicleId } : {};

    const [records, total] = await Promise.all([
      prisma.maintenance.findMany({
        where,
        include: {
          vehicle: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.maintenance.count({ where }),
    ]);

    return successResponse({ records, total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();

    // Validate required fields
    if (!data.vehicleId || !data.date || !data.type || !data.description) {
      return handleApiError(new ApiError('Missing required fields', 400));
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      return handleApiError(new ApiError('Vehicle not found', 404));
    }

    // Create maintenance record
    const record = await prisma.maintenance.create({
      data: {
        ...data,
      },
      include: {
        vehicle: true,
      },
    });

    // Update vehicle status if maintenance is completed
    if (data.status === 'COMPLETED') {
      await prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: 'ACTIVE' },
      });
    } else if (data.status === 'IN_PROGRESS') {
      await prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: 'MAINTENANCE' },
      });
    }

    return successResponse(record);
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
      return handleApiError(new ApiError('Maintenance record ID is required', 400));
    }

    // Check if maintenance record exists
    const existingRecord = await prisma.maintenance.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return handleApiError(new ApiError('Maintenance record not found', 404));
    }

    // Update maintenance record
    const record = await prisma.maintenance.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
      },
    });

    // Update vehicle status based on maintenance status
    if (updateData.status === 'COMPLETED') {
      await prisma.vehicle.update({
        where: { id: record.vehicleId },
        data: { status: 'ACTIVE' },
      });
    } else if (updateData.status === 'IN_PROGRESS') {
      await prisma.vehicle.update({
        where: { id: record.vehicleId },
        data: { status: 'MAINTENANCE' },
      });
    }

    return successResponse(record);
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
      return handleApiError(new ApiError('Maintenance record ID is required', 400));
    }

    // Check if maintenance record exists
    const record = await prisma.maintenance.findUnique({
      where: { id },
    });

    if (!record) {
      return handleApiError(new ApiError('Maintenance record not found', 404));
    }

    // Delete the maintenance record
    await prisma.maintenance.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

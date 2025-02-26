import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { ApiError } from '@/lib/api-error';
import { successResponse, handleApiError } from '@/lib/api-response';
import { Prisma, ExpenseType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await getAuthSession();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const vehicleId = searchParams.get('vehicleId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleExpenseWhereInput = {
      AND: [
        vehicleId ? { vehicleId } : {},
        type ? { type: type as ExpenseType } : {},
        startDate ? { date: { gte: new Date(startDate) } } : {},
        endDate ? { date: { lte: new Date(endDate) } } : {},
      ],
    };

    const [expenses, total] = await Promise.all([
      prisma.vehicleExpense.findMany({
        where,
        include: {
          vehicle: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.vehicleExpense.count({ where }),
    ]);

    // Calculate totals
    const totals = await prisma.vehicleExpense.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true,
      },
    });

    return successResponse({
      expenses,
      total,
      totals,
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
    if (!data.vehicleId || !data.type || !data.amount || !data.date) {
      return handleApiError(new ApiError('Missing required fields', 400));
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      return handleApiError(new ApiError('Vehicle not found', 404));
    }

    const expense = await prisma.vehicleExpense.create({
      data: {
        ...data,
        userId: session.user.id,
      },
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(expense);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();

    if (!data.id) {
      return handleApiError(new ApiError('Missing expense ID', 400));
    }

    // Check if expense exists
    const expense = await prisma.vehicleExpense.findUnique({
      where: { id: data.id },
    });

    if (!expense) {
      return handleApiError(new ApiError('Expense not found', 404));
    }

    const updatedExpense = await prisma.vehicleExpense.update({
      where: { id: data.id },
      data,
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(updatedExpense);
  } catch (error) {
    return handleApiError(error);
  }
}

// Export expenses to Excel
export async function PATCH(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();
    const { vehicleId, startDate, endDate } = data;

    const where: Prisma.VehicleExpenseWhereInput = {
      AND: [
        vehicleId ? { vehicleId } : {},
        startDate ? { date: { gte: new Date(startDate) } } : {},
        endDate ? { date: { lte: new Date(endDate) } } : {},
      ],
    };

    const expenses = await prisma.vehicleExpense.findMany({
      where,
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Transform data for Excel
    const excelData = expenses.map(expense => ({
      'التاريخ': new Date(expense.date).toLocaleDateString('ar-EG'),
      'رقم اللوحة': expense.vehicle.plateNumber,
      'الموديل': expense.vehicle.model,
      'نوع المصروف': getExpenseTypeText(expense.type),
      'المبلغ': expense.amount.toLocaleString('ar-EG'),
      'قراءة العداد': expense.odometer?.toLocaleString('ar-EG') || '',
      'ملاحظات': expense.notes || '',
      'المستخدم': expense.user.name,
    }));

    return successResponse(excelData);
  } catch (error) {
    return handleApiError(error);
  }
}

function getExpenseTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    FUEL: 'وقود',
    MAINTENANCE: 'صيانة',
    OIL_CHANGE: 'تغيير زيت',
    TIRES: 'إطارات',
    INSURANCE: 'تأمين',
    OTHER: 'أخرى',
  };
  return typeMap[type] || type;
}

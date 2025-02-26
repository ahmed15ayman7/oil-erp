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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      AND: [
        {
          OR: [
            { invoiceNumber: { contains: search } },
            { customer: { name: { contains: search } } },
          ],
        },
        status ? { status: status as any } : {},
        startDate ? { date: { gte: new Date(startDate) } } : {},
        endDate ? { date: { lte: new Date(endDate) } } : {},
      ],
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
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
      prisma.sale.count({ where }),
    ]);

    // Calculate totals
    const totals = await prisma.sale.aggregate({
      where,
      _sum: {
        subtotal: true,
        tax: true,
        discount: true,
        total: true,
      },
    });

    return successResponse({
      sales,
      total,
      totals: totals._sum,
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
    if (!data.customerId || !data.items || !data.items.length) {
      return handleApiError(new ApiError('Missing required fields', 400));
    }

    // Generate invoice number
    const lastSale = await prisma.sale.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const invoiceNumber = lastSale
      ? `INV-${String(parseInt(lastSale.invoiceNumber.split('-')[1]) + 1).padStart(5, '0')}`
      : 'INV-00001';

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );
    const tax = (data.tax || 0) * subtotal;
    const discount = data.discount || 0;
    const total = subtotal + tax - discount;

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber,
        customerId: data.customerId,
        date: data.date || new Date(),
        dueDate: data.dueDate,
        repId: data.repId || session.user.id, // Add required repId field
        status: data.status || 'PENDING',
        subtotal,
        tax: data.tax || 0,
        discount,
        total,
        notes: data.notes,
        userId: session.user.id,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
            notes: item.notes,
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update product quantities
    await Promise.all(
      data.items.map((item: any) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        })
      )
    );

    return successResponse(sale);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();

    if (!data.id) {
      return handleApiError(new ApiError('Missing sale ID', 400));
    }

    // Check if sale exists
    const sale = await prisma.sale.findUnique({
      where: { id: data.id },
      include: {
        items: true,
      },
    });

    if (!sale) {
      return handleApiError(new ApiError('Sale not found', 404));
    }

    // Restore old quantities
    await Promise.all(
      sale.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        })
      )
    );

    // Calculate new totals
    const subtotal = data.items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );
    const tax = (data.tax || 0) * subtotal;
    const discount = data.discount || 0;
    const total = subtotal + tax - discount;

    // Update sale
    const updatedSale = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.saleItem.deleteMany({
        where: { saleId: data.id },
      });

      // Update sale with new items
      return tx.sale.update({
        where: { id: data.id },
        data: {
          customerId: data.customerId,
          date: data.date,
          dueDate: data.dueDate,
          status: data.status,
          subtotal,
          tax: data.tax || 0,
          discount,
          total,
          notes: data.notes,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price,
              notes: item.notes,
            })),
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    // Update new quantities
    await Promise.all(
      data.items.map((item: any) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        })
      )
    );

    return successResponse(updatedSale);
  } catch (error) {
    return handleApiError(error);
  }
}

// Export sales to Excel
export async function PATCH(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();
    const { startDate, endDate, status } = data;

    const where: Prisma.SaleWhereInput = {
      AND: [
        status ? { status: status as any } : {},
        startDate ? { date: { gte: new Date(startDate) } } : {},
        endDate ? { date: { lte: new Date(endDate) } } : {},
      ],
    };

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
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
    const excelData = sales.map(sale => ({
      'رقم الفاتورة': sale.invoiceNumber,
      'التاريخ': new Date(sale.date).toLocaleDateString('ar-EG'),
      'تاريخ الاستحقاق': sale.dueDate ? new Date(sale.dueDate).toLocaleDateString('ar-EG') : '',
      'العميل': sale.customer.name,
      'المنتجات': sale.items.map(item => `${item.product.name} (${item.quantity})`).join(', '),
      'إجمالي المنتجات': sale.subtotal.toLocaleString('ar-EG'),
      'الضريبة': sale.tax.toLocaleString('ar-EG'),
      'الخصم': sale.discount.toLocaleString('ar-EG'),
      'الإجمالي': sale.total.toLocaleString('ar-EG'),
      'الحالة': getStatusText(sale.status),
      'البائع': sale.user.name,
      'ملاحظات': sale.notes || '',
    }));

    return successResponse(excelData);
  } catch (error) {
    return handleApiError(error);
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PAID: 'مدفوع',
    PARTIALLY_PAID: 'مدفوع جزئياً',
    PENDING: 'معلق',
    OVERDUE: 'متأخر',
    CANCELLED: 'ملغي',
  };
  return statusMap[status] || status;
}

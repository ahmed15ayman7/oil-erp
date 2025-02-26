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

    const where: Prisma.PurchaseWhereInput = {
      AND: [
        {
          OR: [
            { invoiceNumber: { contains: search } },
            { supplier: { name: { contains: search } } },
          ],
        },
        status ? { status: status as any } : {},
        startDate ? { date: { gte: new Date(startDate) } } : {},
        endDate ? { date: { lte: new Date(endDate) } } : {},
      ],
    };

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: true,
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
      prisma.purchase.count({ where }),
    ]);

    // Calculate totals
    const totals = await prisma.purchase.aggregate({
      where,
      _sum: {
        subtotal: true,
        tax: true,
        discount: true,
        total: true,
      },
    });

    return successResponse({
      purchases,
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
    if (!data.supplierId || !data.items || !data.items.length) {
      return handleApiError(new ApiError('Missing required fields', 400));
    }

    // Generate invoice number
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const invoiceNumber = lastPurchase
      ? `PO-${String(parseInt(lastPurchase.invoiceNumber.split('-')[1]) + 1).padStart(5, '0')}`
      : 'PO-00001';

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );
    const tax = (data.tax || 0) * subtotal;
    const discount = data.discount || 0;
    const total = subtotal + tax - discount;

    // Create purchase with items
    const purchase = await prisma.purchase.create({
      data: {
        invoiceNumber,
        supplierId: data.supplierId,
        date: data.date || new Date(),
        dueDate: data.dueDate,
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
        supplier: true,
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

    // Update product quantities and last purchase price
    await Promise.all(
      data.items.map((item: any) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
            lastPurchasePrice: item.price,
          },
        })
      )
    );

    return successResponse(purchase);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();

    if (!data.id) {
      return handleApiError(new ApiError('Missing purchase ID', 400));
    }

    // Check if purchase exists
    const purchase = await prisma.purchase.findUnique({
      where: { id: data.id },
      include: {
        items: true,
      },
    });

    if (!purchase) {
      return handleApiError(new ApiError('Purchase not found', 404));
    }

    // Restore old quantities
    await Promise.all(
      purchase.items.map((item) =>
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

    // Calculate new totals
    const subtotal = data.items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );
    const tax = (data.tax || 0) * subtotal;
    const discount = data.discount || 0;
    const total = subtotal + tax - discount;

    // Update purchase
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: data.id },
      });

      // Update purchase with new items
      return tx.purchase.update({
        where: { id: data.id },
        data: {
          supplierId: data.supplierId,
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
          supplier: true,
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

    // Update new quantities and last purchase price
    await Promise.all(
      data.items.map((item: any) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
            lastPurchasePrice: item.price,
          },
        })
      )
    );

    return successResponse(updatedPurchase);
  } catch (error) {
    return handleApiError(error);
  }
}

// Export purchases to Excel
export async function PATCH(request: NextRequest) {
  try {
    await getAuthSession();

    const data = await request.json();
    const { startDate, endDate, status } = data;

    const where: Prisma.PurchaseWhereInput = {
      AND: [
        status ? { status: status as any } : {},
        startDate ? { date: { gte: new Date(startDate) } } : {},
        endDate ? { date: { lte: new Date(endDate) } } : {},
      ],
    };

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
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
    const excelData = purchases.map(purchase => ({
      'رقم الفاتورة': purchase.invoiceNumber,
      'التاريخ': new Date(purchase.date).toLocaleDateString('ar-EG'),
      'تاريخ الاستحقاق': purchase.dueDate ? new Date(purchase.dueDate).toLocaleDateString('ar-EG') : '',
      'المورد': purchase.supplier.name,
      'المنتجات': purchase.items.map(item => `${item.product.name} (${item.quantity})`).join(', '),
      'إجمالي المنتجات': purchase.subtotal.toLocaleString('ar-EG'),
      'الضريبة': purchase.tax.toLocaleString('ar-EG'),
      'الخصم': purchase.discount.toLocaleString('ar-EG'),
      'الإجمالي': purchase.total.toLocaleString('ar-EG'),
      'الحالة': getStatusText(purchase.status),
      'المشتري': purchase.user.name,
      'ملاحظات': purchase.notes || '',
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

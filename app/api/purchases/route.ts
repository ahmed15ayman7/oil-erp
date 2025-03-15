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
              material: true,
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
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { supplierId, items, dueDate, tax, discount } = body;

    // حساب المجاميع
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const total = subtotal + tax - discount;

    // إنشاء رقم الفاتورة
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const lastNumber = lastPurchase ? parseInt(lastPurchase.invoiceNumber.split("-")[1]) : 0;
    const invoiceNumber = `PUR-${(lastNumber + 1).toString().padStart(5, "0")}`;

    // بدء المعاملة
    const result = await prisma.$transaction(async (tx) => {
      // 1. إنشاء الفاتورة
      const purchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          supplierId,
          date: new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          subtotal,
          tax,
          discount,
          total,
          userId: session.user.id,
          items: {
            create: items.map((item: any) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
          },
        },
      });

      // 2. تحديث المخزون
      for (const item of items) {
        await tx.material.update({
          where: { id: item.materialId },
          data: {
            quantity: {
              increment: item.quantity,
            },
            lastPurchasePrice: item.price,
          },
        });

        // إنشاء حركة مخزون
        // await tx.stockMovement.create({
        //   data: {
        //     materialId: item.materialId,
        //     type: "PURCHASE",
        //     quantity: item.quantity,
        //     reference: invoiceNumber,
        //     userId: session.user.id,
        //   },
        // });
      }

      // 3. إنشاء معاملة مالية في الخزينة
      const transaction = await tx.transaction.create({
        data: {
          type: "PURCHASE_PAYMENT",
          amount: -total, // قيمة سالبة لأنها مصروفات
          description: `دفع فاتورة مشتريات رقم ${invoiceNumber}`,
          reference: invoiceNumber,
          referenceType: "PURCHASE",
          purchaseId: purchase.id,
          createdBy: session.user.id,
        },
      });

      return purchase;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PURCHASES_POST]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الفاتورة" },
      { status: 500 }
    );
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
        prisma.material.update({
          where: { id: item.materialId },
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
              material: true,
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
            material: true,
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
      'المواد': purchase.items.map(item => `${item.material.name} (${item.quantity})`).join(', '),
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

// تحديث دالة الحذف لحذف المعاملات المالية المرتبطة
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "معرف الفاتورة مطلوب" },
        { status: 400 }
      );
    }

    // بدء المعاملة
    await prisma.$transaction(async (tx) => {
      // 1. حذف المعاملات المالية المرتبطة
      await tx.transaction.deleteMany({
        where: {
          OR: [
            { purchaseId: id },
            { reference: { startsWith: `PUR-` }, referenceType: "PURCHASE" },
          ],
        },
      });

      // 2. استرجاع المخزون
      const purchaseItems = await tx.purchaseItem.findMany({
        where: { purchaseId: id },
      });

      for (const item of purchaseItems) {
        await tx.material.update({
          where: { id: item.materialId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // إنشاء حركة مخزون عكسية
        // await tx.stockMovement.create({
        //   data: {
        //     materialId: item.materialId,
        //     type: "RETURN",
        //     quantity: -item.quantity,
        //     reference: `RETURN-${id}`,
        //     userId: session.user.id,
        //   },
        // });
      }

      // 3. حذف الفاتورة
      await tx.purchase.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PURCHASES_DELETE]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الفاتورة" },
      { status: 500 }
    );
  }
}

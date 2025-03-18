import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { ApiError } from '@/lib/api-error';
import { successResponse, handleApiError } from '@/lib/api-response';
import { Prisma, PaymentStatus, TransactionType } from '@prisma/client';

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
        status ? { status: status as PaymentStatus } : {},
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
              product: {
                include: {
                  category: true,
                },
              },
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
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { customerId, items, dueDate, tax=0, discount=0, repId,status } = body;

    // حساب المجاميع
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const total = subtotal + tax - discount;
    console.log("total", total)
    // إنشاء رقم الفاتورة
    const lastSale = await prisma.sale.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const lastNumber = lastSale ? parseInt(lastSale.invoiceNumber.split("-")[1]) : 0;
    const invoiceNumber = `INV-${(lastNumber + 1).toString().padStart(5, "0")}`;

    // بدء المعاملة
    const result = await prisma.$transaction(async (tx) => {
      // 1. إنشاء الفاتورة
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customer: {
            connect: {
              id: customerId
            }
          },
          date: new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          subtotal,
          tax,
          status,
          discount,
          total,
          user: { connect: { id: session.user.id } },
          rep:repId && {
            connect: {
              id: repId
            }
          },
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
          },
        },
      });

      // 2. تحديث المخزون
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // إنشاء حركة مخزون
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "SALE",
            quantity: -item.quantity,
            reference: invoiceNumber,
            userId: session.user.id,
          },
        });
      }

      // 3. إنشاء معاملة مالية في الخزينة
      const transaction = await tx.transaction.create({
        data: {
          type: "SALE_PAYMENT",
          amount: total,
          description: `دفع فاتورة مبيعات رقم ${invoiceNumber}`,
          reference: invoiceNumber,
          referenceType: "SALE",
          saleId: sale.id,
          createdBy: session.user.id,
        },
      });

      // 4. إذا كان هناك مندوب، إنشاء معاملة مالية لعمولة التوصيل
      if (repId) {
        const representative = await tx.representative.findUnique({
          where: { id: repId },
        });

        if (representative && representative.deliveryFee > 0) {
          await tx.transaction.create({
            data: {
              type: "DELIVERY_PAYMENT",
              amount: -representative.deliveryFee,
              description: `عمولة توصيل للمندوب - فاتورة رقم ${invoiceNumber}`,
              reference: invoiceNumber,
              referenceType: "SALE",
              representativeId: repId,
              createdBy: session.user.id,
            },
          });
        }
      }

      return sale;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[SALES_POST]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الفاتورة" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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
    let transaction = await prisma.transaction.findFirst({
      where: { saleId: data.id },
    })
    if(transaction){
    await prisma.transaction.updateMany({
      where: { saleId: data.id },
      data: {
        amount: total, // قيمة سالبة لأنها مصروفات
      },
    });
    }else{
       await prisma.transaction.create({
        data: {
          type: "SALE_PAYMENT",
          amount: total, // قيمة سالبة لأنها مصروفات
          description: `دفع فاتورة مبيعات رقم ${updatedSale.invoiceNumber}`,
          reference: updatedSale.invoiceNumber,
          referenceType: "SALE",
          saleId: updatedSale.id,
          createdBy: session.user.id,
        },
      });}
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
        status ? { status: status as PaymentStatus } : {},
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
      'العميل': sale.customer?.name,
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
            { saleId: id },
            { reference: { startsWith: `INV-` }, referenceType: "SALE" },
          ],
        },
      });

      // 2. استرجاع المخزون
      const saleItems = await tx.saleItem.findMany({
        where: { saleId: id },
      });

      for (const item of saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });

        // إنشاء حركة مخزون عكسية
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "RETURN",
            quantity: item.quantity,
            reference: `RETURN-${id}`,
            userId: session.user.id,
          },
        });
      }

      // 3. حذف الفاتورة
      await tx.sale.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SALES_DELETE]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الفاتورة" },
      { status: 500 }
    );
  }
}

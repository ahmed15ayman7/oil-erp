import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { addDays, startOfDay, endOfDay, subDays, format, subMonths, subYears } from 'date-fns';
import { ar } from 'date-fns/locale';

// دالة مساعدة للحصول على نطاق التاريخ
function getDateRange(range: string, date: string) {
  const currentDate = new Date(date);
  let startDate = startOfDay(currentDate);
  let endDate = endOfDay(currentDate);
  let previousStartDate;
  let previousEndDate;

  switch (range) {
    case 'week':
      startDate = subDays(startDate, 6);
      previousStartDate = subDays(startDate, 7);
      previousEndDate = subDays(startDate, 1);
      break;
    case 'month':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      previousStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      previousEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      break;
    case 'year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear(), 11, 31);
      previousStartDate = new Date(currentDate.getFullYear() - 1, 0, 1);
      previousEndDate = new Date(currentDate.getFullYear() - 1, 11, 31);
      break;
  }

  return { startDate, endDate, previousStartDate, previousEndDate };
}

// دالة لحساب نسبة النمو
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// دالة لإرسال إشعار WhatsApp
async function sendWhatsAppNotification(product: { name: string; quantity: number; minQuantity: number }) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const recipientNumber = process.env.ADMIN_WHATSAPP_NUMBER;

  if (!accessToken || !phoneNumberId || !recipientNumber) {
    console.error("❌ WhatsApp credentials not configured");
    return;
  }

  try {
    console.log("🚀 Sending WhatsApp notification...");

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientNumber,
          type: "template",
          template: {
            name: "low_stock_alert", // تأكد من أن هذا هو اسم القالب الفعلي
            language: { code: "ar" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: product.name },
                  { type: "text", text: product.quantity.toString() },
                  { type: "text", text: product.minQuantity.toString() },
                ],
              },
            ],
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to send WhatsApp notification: ${result.error?.message || "Unknown error"}`);
    }

    console.log("✅ WhatsApp notification sent successfully:", result);
  } catch (error) {
    console.error("❌ Error sending WhatsApp notification:", error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("غير مصرح", { status: 401 });
    }

    // استخراج معلمات التصفية من URL
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week';
    const date = searchParams.get('date') || new Date().toISOString();

    const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(range, date);

    const [
      // الإحصائيات الأساسية
      inventoryStats,
      activeVehicles,
      todaySales,
      treasury,

      // إحصائيات إضافية
      customersCount,
      suppliersCount,
      productsCount,

      // إحصائيات المبيعات والإنتاج
      productionHistory,
      salesHistory,
      currentSales,
      previousSales,

      // إحصائيات المخزون والموارد
      lowStockProducts,
      materialStats,
      inventoryHistory,

      // إحصائيات الموظفين والمركبات
      activeDrivers,
      deliveryStats
    ] = await Promise.all([
      // الإحصائيات الأساسية
      prisma.product.aggregate({
        _sum: { quantity: true }
      }),
      prisma.vehicle.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.sale.aggregate({
        where: { date: { gte: startOfDay(new Date()) } },
        _sum: { total: true }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true }
      }),

      // إحصائيات إضافية
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.product.count(),

      // إحصائيات الإنتاج والمبيعات
      prisma.materialTransaction.groupBy({
        by: ['createdAt'],
        where: {
          type: 'OUT',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          quantity: true,
        },
      }),

      prisma.sale.groupBy({
        by: ['date'],
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          total: true,
        },
        _count: true,
      }),

      // المبيعات الحالية
      prisma.sale.aggregate({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          total: true,
        },
        _count: true,
      }),

      // المبيعات السابقة
      prisma.sale.aggregate({
        where: {
          date: {
            gte: previousStartDate,
            lte: previousEndDate,
          },
        },
        _sum: {
          total: true,
        },
        _count: true,
      }),

      // المنتجات منخفضة المخزون
      prisma.product.findMany({
        where: {
          quantity: { lte: prisma.product.fields.minQuantity }
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          minQuantity: true
        }
      }),

      // إحصائيات المواد الخام
      prisma.material.groupBy({
        by: ['type'],
        _sum: { quantity: true }
      }),

      // سجل حركة المخزون
      prisma.stockMovement.groupBy({
        by: ['createdAt', 'type'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          quantity: true,
        },
      }),

      // السائقين النشطين
      prisma.driver.count({
        where: { status: 'ACTIVE' }
      }),

      // إحصائيات التوصيل
      prisma.delivery.groupBy({
        by: ['status'],
        _count: true,
      })
    ]);

    // حساب نمو المبيعات والطلبات
    const currentRevenue = currentSales._sum.total || 0;
    const previousRevenue = previousSales._sum.total || 0;
    const currentOrders = currentSales._count || 0;
    const previousOrders = previousSales._count || 0;

    const revenueGrowth = calculateGrowth(currentRevenue, previousRevenue);
    const ordersGrowth = calculateGrowth(currentOrders, previousOrders);

    // إرسال إشعارات WhatsApp للمنتجات منخفضة المخزون
    for (const product of lowStockProducts) {
      if (product.quantity <= product.minQuantity) {
        await sendWhatsAppNotification(product);
      }
    }

    // تنظيم بيانات سجل المخزون
    const inventoryHistoryMap = new Map();
    let currentStock = inventoryStats._sum.quantity || 0;

    inventoryHistory.forEach((record) => {
      const date = format(record.createdAt, 'yyyy-MM-dd', { locale: ar });
      if (!inventoryHistoryMap.has(date)) {
        inventoryHistoryMap.set(date, {
          date,
          inStock: currentStock,
          added: 0,
          removed: 0,
        });
      }

      const entry = inventoryHistoryMap.get(date);
      if (record.type === 'PURCHASE') {
        entry.added += record._sum.quantity || 0;
      } else if (record.type === 'SALE') {
        entry.removed += record._sum.quantity || 0;
      }
    });

    // تحويل التوصيلات إلى التنسيق المطلوب
    const deliveries = deliveryStats.map((stat) => ({
      status: stat.status,
      count: stat._count,
    }));

    return NextResponse.json({
      // الإحصائيات الأساسية
      inventory: {
        total: inventoryStats._sum.quantity || 0,
        lowStock: lowStockProducts.length,
        history: Array.from(inventoryHistoryMap.values()),
      },
      vehicles: {
        active: activeVehicles,
        pendingDeliveries: deliveries.find((d) => d.status === 'PENDING')?.count || 0,
      },
      sales: {
        today: todaySales._sum.total || 0,
        totalRevenue: currentRevenue,
        totalOrders: currentOrders,
        growth: {
          revenue: revenueGrowth,
          orders: ordersGrowth,
        },
        history: salesHistory.map((record) => ({
          date: format(record.date, 'yyyy-MM-dd', { locale: ar }),
          revenue: record._sum.total || 0,
          orders: record._count || 0,
          averageOrderValue: record._sum.total && record._count
            ? record._sum.total / record._count
            : 0,
        })),
      },
      treasury: treasury._sum.amount || 0,

      // إحصائيات عامة
      counts: {
        customers: customersCount,
        suppliers: suppliersCount,
        products: productsCount,
        activeDrivers
      },

      // إحصائيات الإنتاج
      production: {
        history: productionHistory.map((record) => ({
          date: format(record.createdAt, 'yyyy-MM-dd', { locale: ar }),
          quantity: record._sum.quantity || 0,
        })),
        materials: materialStats,
      },

      // معلومات تحليلية
      analytics: {
        lowStockProducts,
        deliveries,
      },

      // الوقت والتحديث
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
    return new NextResponse("خطأ داخلي في الخادم", { status: 500 });
  }
}
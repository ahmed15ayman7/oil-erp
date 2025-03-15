import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { addDays, startOfDay, endOfDay, subDays, format, subMonths, subYears ,Locale, addHours, addWeeks, addMonths} from 'date-fns';
import { ar } from 'date-fns/locale';

// دالة مساعدة للحصول على نطاق التاريخ
function getDateRange(range: string, date: string) {
  const currentDate = new Date(date);
  let startDate = startOfDay(currentDate);
  let endDate = endOfDay(currentDate);
  let previousStartDate;
  let previousEndDate;
  let interval: 'hour' | 'day' | 'week' | 'month' = 'day';
  let timeFormat: string="dd MMM";

  switch (range) {
    case 'day':
      interval = 'hour';
      timeFormat = 'HH:mm';
      startDate = startOfDay(currentDate);
      endDate = endOfDay(currentDate);
      previousStartDate = subDays(startDate, 1);
      previousEndDate = subDays(endDate, 1);
      break;
    case 'week':
      interval = 'day';
      timeFormat = 'dd MMM';
      startDate = subDays(startDate, 6);
      previousStartDate = subDays(startDate, 7);
      previousEndDate = subDays(startDate, 1);
      break;
    case 'month':
      interval = 'week';
      timeFormat = "'أسبوع' w, MMM";
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      previousStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      previousEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      break;
    case 'year':
      interval = 'month';
      timeFormat = 'MMM yyyy';
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear(), 11, 31);
      previousStartDate = new Date(currentDate.getFullYear() - 1, 0, 1);
      previousEndDate = new Date(currentDate.getFullYear() - 1, 11, 31);
      break;
  }

  return { startDate, endDate, previousStartDate, previousEndDate, interval, timeFormat };
}

// دالة للحصول على تنسيق التاريخ المناسب حسب النطاق
function getDateFormat(interval: string, locale: Locale = ar): string {
  switch (interval) {
    case 'hour':
      return 'HH:mm';
    case 'day':
      return 'dd MMM';
    case 'week':
      return "'أسبوع' w, MMM";
    case 'month':
      return 'MMM yyyy';
    default:
      return 'dd MMM yyyy';
  }
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

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week';
    const date = searchParams.get('date') || new Date().toISOString();
    const type = searchParams.get('type') || 'all';

    const { startDate, endDate, previousStartDate, previousEndDate, interval, timeFormat } = getDateRange(range, date);
    const dateFormat = getDateFormat(interval);

    let response: any = {};

    switch (type) {
      case 'sales':
        const salesData = await getSalesAnalytics(startDate!, endDate!, previousStartDate!, previousEndDate!, interval, dateFormat);
        response = salesData;
        break;
      
      case 'inventory':
        const inventoryData = await getInventoryAnalytics(startDate, endDate, interval, dateFormat);
        response = inventoryData;
        break;
      
      case 'production':
        const productionData = await getProductionAnalytics(startDate, endDate, interval, dateFormat);
        response = productionData;
        break;
      
      case 'basic':
        const basicStats = await getBasicStats();
        response = basicStats;
        break;
      
      default:
        // الحصول على جميع البيانات
        const [sales, inventory, production, basic] = await Promise.all([
          getSalesAnalytics(startDate, endDate, previousStartDate! , previousEndDate!, interval, dateFormat),
          getInventoryAnalytics(startDate, endDate, interval, dateFormat),
          getProductionAnalytics(startDate, endDate, interval, dateFormat),
          getBasicStats()
        ]);
        
        response = {
          ...sales,
          ...inventory,
          ...production,
          ...basic
        };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
    return new NextResponse("خطأ داخلي في الخادم", { status: 500 });
  }
}

// دوال مساعدة للحصول على البيانات
async function getBasicStats() {
    const [
      inventoryStats,
      activeVehicles,
      todaySales,
      treasury,
      customersCount,
      suppliersCount,
      productsCount,
    activeDrivers
    ] = await Promise.all([
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
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.product.count(),
    prisma.driver.count({
      where: { status: 'ACTIVE' }
    })
  ]);

  return {
    inventory: {
      total: inventoryStats._sum.quantity || 0
    },
    vehicles: {
      active: activeVehicles
    },
    sales: {
      today: todaySales._sum.total || 0
    },
    treasury: treasury._sum.amount || 0,
    counts: {
      customers: customersCount,
      suppliers: suppliersCount,
      products: productsCount,
      activeDrivers
    }
  };
}

async function getSalesAnalytics(startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date, interval: string, dateFormat: string) {
  // إنشاء خريطة زمنية كاملة
  const timeMap = new Map();
  let currentTime = new Date(startDate);
  
  while (currentTime <= endDate) {
    const timeKey = format(currentTime, dateFormat, { locale: ar });
    timeMap.set(timeKey, {
      date: timeKey,
      revenue: 0,
      orders: 0,
      averageOrderValue: 0
    });

    // تحديث الوقت حسب الفترة
    switch (interval) {
      case 'hour':
        currentTime = addHours(currentTime, 1);
        break;
      case 'day':
        currentTime = addDays(currentTime, 1);
        break;
      case 'week':
        currentTime = addWeeks(currentTime, 1);
        break;
      case 'month':
        currentTime = addMonths(currentTime, 1);
        break;
    }
  }

  // جلب البيانات وتجميعها
  const [currentSales, previousSales, salesHistory] = await Promise.all([
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
    prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        total: true,
      },
      orderBy: {
        date: 'asc',
      },
    })
  ]);

  // تجميع البيانات في الفترات الزمنية
  salesHistory.forEach((sale) => {
    const timeKey = format(sale.date, dateFormat, { locale: ar });
    if (timeMap.has(timeKey)) {
      const entry = timeMap.get(timeKey);
      entry.revenue += sale.total;
      entry.orders += 1;
      entry.averageOrderValue = entry.revenue / entry.orders;
    }
  });

  const currentRevenue = currentSales._sum.total || 0;
  const previousRevenue = previousSales._sum.total || 0;
  const currentOrders = currentSales._count || 0;
  const previousOrders = previousSales._count || 0;

  return {
    totalRevenue: currentRevenue,
    totalOrders: currentOrders,
    growth: {
      revenue: calculateGrowth(currentRevenue, previousRevenue),
      orders: calculateGrowth(currentOrders, previousOrders),
    },
    history: Array.from(timeMap.values()),
  };
}

async function getInventoryAnalytics(startDate: Date, endDate: Date, interval: string, dateFormat: string) {
  // إنشاء خريطة زمنية كاملة
  const timeMap = new Map();
  let currentTime = new Date(startDate);
  
  while (currentTime <= endDate) {
    const timeKey = format(currentTime, dateFormat, { locale: ar });
    timeMap.set(timeKey, {
      date: timeKey,
      inStock: 0,
      added: 0,
      removed: 0,
    });

    // تحديث الوقت حسب الفترة
    switch (interval) {
      case 'hour':
        currentTime = addHours(currentTime, 1);
        break;
      case 'day':
        currentTime = addDays(currentTime, 1);
        break;
      case 'week':
        currentTime = addWeeks(currentTime, 1);
        break;
      case 'month':
        currentTime = addMonths(currentTime, 1);
        break;
    }
  }

  const [inventoryStats, lowStockProducts, inventoryHistory] = await Promise.all([
    prisma.product.aggregate({
      _sum: { quantity: true }
    }),
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
    prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        type: true,
        quantity: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  ]);

  let currentStock = inventoryStats._sum.quantity || 0;

  // تجميع البيانات في الفترات الزمنية
  inventoryHistory.forEach((movement) => {
    const timeKey = format(movement.createdAt, dateFormat, { locale: ar });
    if (timeMap.has(timeKey)) {
      const entry = timeMap.get(timeKey);
      if (movement.type === 'PURCHASE') {
        entry.added += movement.quantity;
      } else if (movement.type === 'SALE') {
        entry.removed += movement.quantity;
      }
      entry.inStock = currentStock;
    }
  });

  return {
    total: currentStock,
    lowStock: lowStockProducts.length,
    lowStockProducts,
    history: Array.from(timeMap.values()),
  };
}

async function getProductionAnalytics(startDate: Date, endDate: Date, interval: string, dateFormat: string) {
  // إنشاء خريطة زمنية كاملة
  const timeMap = new Map();
  let currentTime = new Date(startDate);
  
  while (currentTime <= endDate) {
    const timeKey = format(currentTime, dateFormat, { locale: ar });
    timeMap.set(timeKey, {
      date: timeKey,
      quantity: 0,
    });

    // تحديث الوقت حسب الفترة
    switch (interval) {
      case 'hour':
        currentTime = addHours(currentTime, 1);
        break;
      case 'day':
        currentTime = addDays(currentTime, 1);
        break;
      case 'week':
        currentTime = addWeeks(currentTime, 1);
        break;
      case 'month':
        currentTime = addMonths(currentTime, 1);
        break;
    }
  }

  const [productionHistory, materialHistory, currentStock] = await Promise.all([
    prisma.materialTransaction.findMany({
      where: {
        type: 'OUT',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        quantity: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),
    prisma.materialTransaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        quantity: true,
        createdAt: true,
        materialId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),
    prisma.material.findMany({
      select: {
        id: true,
        type: true,
        quantity: true,
        unit: true,
      },
    })
  ]);

  // تجميع البيانات في الفترات الزمنية
  productionHistory.forEach((record) => {
    const timeKey = format(record.createdAt, dateFormat, { locale: ar });
    if (timeMap.has(timeKey)) {
      const entry = timeMap.get(timeKey);
      entry.quantity += record.quantity;
    }
  });

  return {
    history: Array.from(timeMap.values()),
    materials: {
      history: Array.from(timeMap.values()),
      currentStock: currentStock.map(material => ({
        type: material.type,
        quantity: material.quantity,
        unit: material.unit,
      })),
    },
  };
}
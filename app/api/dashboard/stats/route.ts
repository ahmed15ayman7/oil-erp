import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("غير مصرح", { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

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
      weeklyProduction,
      monthlyProduction,
      salesByProduct,
      
      // إحصائيات المخزون والموارد
      lowStockProducts,
      materialStats,
      
      // إحصائيات الموظفين والمركبات
      activeDrivers,
      pendingDeliveries
    ] = await Promise.all([
      // الإحصائيات الأساسية
      prisma.product.aggregate({
        _sum: { quantity: true }
      }),
      prisma.vehicle.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.sale.aggregate({
        where: { date: { gte: today } },
        _sum: { total: true }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true }
      }),
      
      // إحصائيات إضافية
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.product.count(),
      
      // إحصائيات المبيعات والإنتاج على مدار الأسبوع
      prisma.sale.groupBy({
        by: ['date'],
        where: { date: { gte: lastWeek } },
        _sum: { total: true }
      }),
      
      // إحصائيات الإنتاج الشهري
      prisma.product.groupBy({
        by: ['type'],
        where: { 
          createdAt: { gte: lastMonth }
        },
        _sum: { quantity: true }
      }),
      
      // المبيعات حسب المنتج
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: { 
          sale: { date: { gte: lastMonth } }
        },
        _sum: { 
          quantity: true,
          total: true
        }
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
      
      // السائقين النشطين
      prisma.driver.count({
        where: { status: 'ACTIVE' }
      }),
      
      // التوصيلات المعلقة
      prisma.delivery.count({
        where: { status: 'PENDING' }
      })
    ]);

    return NextResponse.json({
      // الإحصائيات الأساسية
      inventory: {
        total: inventoryStats._sum.quantity || 0,
        lowStock: lowStockProducts.length
      },
      vehicles: {
        active: activeVehicles,
        pendingDeliveries
      },
      sales: {
        today: todaySales._sum.total || 0,
        weekly: weeklyProduction,
        byProduct: salesByProduct
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
        monthly: monthlyProduction,
        materials: materialStats
      },
      
      // معلومات تحليلية
      analytics: {
        lowStockProducts,
        productionTrends: monthlyProduction,
        materialUsage: materialStats
      },
      
      // الوقت والتحديث
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
    return new NextResponse("خطأ داخلي في الخادم", { status: 500 });
  }
}

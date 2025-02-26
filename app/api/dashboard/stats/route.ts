import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get total inventory count
    const inventory = await prisma.product.aggregate({
      _sum: {
        quantity: true,
      },
    });

    // Get active vehicles count
    const activeVehicles = await prisma.vehicle.count();

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      select: {
        total: true,
      },
    });

    const todayTotalSales = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);

    // Get treasury balance (sum of all transactions)
    const treasury = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      inventory: inventory._sum.quantity || 0,
      activeVehicles,
      todaySales: todayTotalSales,
      treasury: treasury._sum.amount || 0,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

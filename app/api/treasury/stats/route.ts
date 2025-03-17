import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import dayjs from "dayjs";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get("type");
    const timeRange = searchParams.get("timeRange") || "day";

    // إذا تم تحديد نوع المعاملة، قم بإرجاع إحصائيات الرسم البياني
    if (type) {
      let startDate = dayjs();
      let groupByFormat: string;
      let interval: string;

      switch (timeRange) {
        case "day":
          startDate = startDate.startOf("day");
          groupByFormat = "%Y-%m-%d %H:00:00";
          interval = "hour";
          break;
        case "week":
          startDate = startDate.startOf("week");
          groupByFormat = "%Y-%m-%d";
          interval = "day";
          break;
        case "month":
          startDate = startDate.startOf("month");
          groupByFormat = "%Y-%m-%d";
          interval = "day";
          break;
        case "year":
          startDate = startDate.startOf("year");
          groupByFormat = "%Y-%m-01";
          interval = "month";
          break;
        default:
          startDate = startDate.startOf("day");
          groupByFormat = "%Y-%m-%d %H:00:00";
          interval = "hour";
      }

      // جلب المعاملات وتجميعها حسب الفترة الزمنية
      const transactions = await prisma.transaction.findMany({
        where: {
          type: type as any,
          date: {
            gte: startDate.toDate(),
          },
        },
        select: {
          amount: true,
          date: true,
        },
        orderBy: {
          date: "asc",
        },
      });

      // تجميع البيانات حسب الفترة الزمنية
      const groupedData = new Map();
      
      let currentDate = startDate;
      const endDate = dayjs();

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
        const timestamp = currentDate.toISOString();
        groupedData.set(timestamp, {
          timestamp,
          amount: 0,
        });
        
        switch (interval) {
          case "hour":
            currentDate = currentDate.add(1, "hour");
            break;
          case "day":
            currentDate = currentDate.add(1, "day");
            break;
          case "month":
            currentDate = currentDate.add(1, "month");
            break;
        }
      }

      // إضافة المعاملات إلى الفترات الزمنية المناسبة
      transactions.forEach((transaction) => {
        let timeKey;
        const transactionDate = dayjs(transaction.date);
        
        switch (interval) {
          case "hour":
            timeKey = transactionDate.startOf("hour").toISOString();
            break;
          case "day":
            timeKey = transactionDate.startOf("day").toISOString();
            break;
          case "month":
            timeKey = transactionDate.startOf("month").toISOString();
            break;
        }

        if (groupedData.has(timeKey)) {
          const existing = groupedData.get(timeKey);
          existing.amount += transaction.amount;
        }
      });

      return NextResponse.json({
        data: Array.from(groupedData.values()),
      });
    }

    // إذا لم يتم تحديد نوع المعاملة، قم بإرجاع إحصائيات الخزينة العامة
   const today = dayjs().startOf("day");
   const monthStart = dayjs().startOf("month");
   const lastMonthStart = monthStart.subtract(1, 'month').startOf("month");
   const lastMonthEnd = monthStart.subtract(1, 'month').endOf("month");
   
   const [todayStats, monthStats, lastMonthStats, currentMonthExpenses, lastMonthExpenses] = await Promise.all([
     // Today's total revenue
     prisma.transaction.aggregate({
       where: {
         date: {
           gte: today.toDate(),
         },
       },
       _sum: {
         amount: true,
       },
     }),
   
     // Current month total revenue
     prisma.transaction.aggregate({
       where: {
         type: "SALE_PAYMENT",
         date: {
           gte: monthStart.toDate(),
         },
       },
       _sum: {
         amount: true,
       },
     }),
   
     // Previous month total revenue
     prisma.transaction.aggregate({
       where: {
        type:"SALE_PAYMENT",
         date: {
           gte: lastMonthStart.toDate(),
           lte: lastMonthEnd.toDate(),
         },
       },
       _sum: {
         amount: true,
       },
     }),
   
     // Current month total expenses
     prisma.transaction.aggregate({
       where: {
        type:{not:"SALE_PAYMENT"},
        date: {
          gte: monthStart.toDate(),
        },
      },
      _sum: {
        amount: true,
      },
    }),
    
    // Previous month total expenses
    prisma.transaction.aggregate({
      where: {
        type:{not:"SALE_PAYMENT"},
        date: {
           gte: lastMonthStart.toDate(),
           lte: lastMonthEnd.toDate(),
         },
       },
       _sum: {
         amount: true,
       },
     }),
   

   ]);

   return NextResponse.json({
     today: todayStats._sum.amount || 0,
     totalIncome: monthStats._sum.amount || 0,
     incomeChange: ((monthStats._sum.amount || 0) / (lastMonthStats._sum.amount|| 1)) *100  ,
     totalExpenses: currentMonthExpenses._sum.amount || 0,
     expenseChange: (currentMonthExpenses._sum.amount|| 0)/(lastMonthExpenses._sum.amount|| 1) * 100 ,
     balance: (monthStats._sum.amount || 0) - (currentMonthExpenses._sum.amount || 0),
   });

  } catch (error) {
    console.error("[TREASURY_STATS]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب إحصائيات المعاملات" },
      { status: 500 }
    );
  }
} 
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
    const timeRange = searchParams.get("timeRange") || "day";

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

    // جلب جميع سجلات الإنتاج في الفترة المحددة
    const productions = await prisma.production.findMany({
      where: {
        startTime: {
          gte: startDate.toDate(),
        },
        status: "COMPLETED",
      },
      select: {
        assetId: true,
        output: true,
        startTime: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // تجميع البيانات حسب الفترة الزمنية
    const groupedData = new Map();
    
    let currentDate = startDate;
    const endDate = dayjs();

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      const timestamp = currentDate.toISOString();
      groupedData.set(timestamp, { timestamp });
      
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

    // تجميع الإنتاج لكل أصل
    productions.forEach((prod) => {
      let timeKey;
      const prodDate = dayjs(prod.startTime);
      
      switch (interval) {
        case "hour":
          timeKey = prodDate.startOf("hour").toISOString();
          break;
        case "day":
          timeKey = prodDate.startOf("day").toISOString();
          break;
        case "month":
          timeKey = prodDate.startOf("month").toISOString();
          break;
      }

      if (groupedData.has(timeKey)) {
        const existing = groupedData.get(timeKey);
        existing[prod.assetId] = (existing[prod.assetId] || 0) + prod.output;
      }
    });

    return NextResponse.json({
      data: Array.from(groupedData.values()),
    });
  } catch (error) {
    console.error("[ASSETS_PRODUCTION_STATS]", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب إحصائيات الإنتاج" },
      { status: 500 }
    );
  }
} 
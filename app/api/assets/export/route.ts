import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { Asset, AssetStatus, AssetType } from "@prisma/client";

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("الأصول");

    // تعريف الأعمدة
    worksheet.columns = [
      { header: "اسم الأصل", key: "name", width: 30 },
      { header: "النوع", key: "type", width: 15 },
      { header: "القيمة", key: "value", width: 15 },
      { header: "تاريخ الشراء", key: "purchaseDate", width: 15 },
      { header: "موعد الصيانة القادمة", key: "nextMaintenance", width: 20 },
      { header: "الحالة", key: "status", width: 15 },
    ];

    // تنسيق العناوين
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    const typeMap: Record<AssetType, string> = {
      MACHINE: "ماكينة",
      EQUIPMENT: "معدات",
      VEHICLE: "مركبة",
      OTHER: "أخرى",
    };

    const statusMap: Record<AssetStatus, string> = {
      ACTIVE: "نشط",
      MAINTENANCE: "في الصيانة",
      INACTIVE: "غير نشط",
    };

    // تحويل البيانات وإضافتها للجدول
    const rows = assets.map((asset: Asset) => ({
      name: asset.name,
      type: typeMap[asset.type],
      value: asset.value,
      purchaseDate: asset.purchaseDate
        ? new Date(asset.purchaseDate).toLocaleDateString("ar-EG")
        : "",
      nextMaintenance: asset.nextMaintenance
        ? new Date(asset.nextMaintenance).toLocaleDateString("ar-EG")
        : "",
      status: statusMap[asset.status],
    }));

    worksheet.addRows(rows);

    // تنسيق الخلايا
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // تحويل المصنف إلى Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // إرسال الملف
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=assets.xlsx",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/assets/export:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تصدير البيانات" },
      { status: 500 }
    );
  }
}

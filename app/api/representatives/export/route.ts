import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as ExcelJS from "exceljs";

const STATUS_MAP = {
  ACTIVE: "نشط",
  ON_LEAVE: "في إجازة",
  INACTIVE: "غير نشط",
};

export async function GET() {
  try {
    const representatives = await prisma.representative.findMany({
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("المندوبين");

    // تعيين العناوين
    worksheet.columns = [
      { header: "اسم المندوب", key: "name", width: 20 },
      { header: "رقم الهاتف", key: "phone", width: 15 },
      { header: "المنطقة", key: "area", width: 20 },
      { header: "الحالة", key: "status", width: 15 },
    ];

    // تنسيق العناوين
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    // إضافة البيانات
    representatives.forEach((rep) => {
      worksheet.addRow({
        name: rep.name,
        phone: rep.phone,
        area: rep.area,
        status: STATUS_MAP[rep.status as keyof typeof STATUS_MAP],
      });
    });

    // تنسيق الخلايا
    worksheet.eachRow((row) => {
      row.alignment = { horizontal: "center" };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // تحويل الملف إلى Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=representatives.xlsx",
      },
    });
  } catch (error) {
    console.error("Error exporting representatives:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تصدير البيانات" },
      { status: 500 }
    );
  }
} 
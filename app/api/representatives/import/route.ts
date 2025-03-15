import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as ExcelJS from "exceljs";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { RepresentativeStatus } from "@prisma/client";

const REQUIRED_COLUMNS = [
  { key: "name", label: "اسم المندوب" },
  { key: "phone", label: "رقم الهاتف" },
  { key: "area", label: "المنطقة" },
  { key: "status", label: "الحالة" },
];

const STATUS_MAP = {
  "نشط": "ACTIVE",
  "في إجازة": "ON_LEAVE",
  "غير نشط": "INACTIVE",
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "يجب عليك تسجيل الدخول لتنفيذ هذا الإجراء" },
        { status: 401 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { message: "لم يتم تحديد ملف" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json(
        { message: "الملف لا يحتوي على بيانات" },
        { status: 400 }
      );
    }

    // التحقق من وجود الأعمدة المطلوبة
    const headers = worksheet.getRow(1).values as string[];
    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !headers.includes(col.label)
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          message: `الأعمدة التالية مفقودة: ${missingColumns
            .map((col) => col.label)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // تحويل البيانات إلى مصفوفة من الكائنات
    const representatives: { name: string; phone: string; area: string; status: RepresentativeStatus; createdBy: string }[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // تخطي صف العناوين

      const values = row.values as string[];
      const nameIndex = headers.indexOf("اسم المندوب");
      const phoneIndex = headers.indexOf("رقم الهاتف");
      const areaIndex = headers.indexOf("المنطقة");
      const statusIndex = headers.indexOf("الحالة");

      const status = STATUS_MAP[values[statusIndex] as keyof typeof STATUS_MAP];
      if (!status) {
        throw new Error(`قيمة غير صالحة للحالة في الصف ${rowNumber}`);
      }

      representatives.push({
        name: values[nameIndex],
        phone: values[phoneIndex],
        area: values[areaIndex],
        status: status as RepresentativeStatus,
        createdBy: session.user.id,
      });
    });

    // إضافة البيانات إلى قاعدة البيانات
    await prisma.representative.createMany({
      data: representatives,
      skipDuplicates: true as never,
    });

    return NextResponse.json({
      message: "تم استيراد البيانات بنجاح",
      count: representatives.length,
    });
  } catch (error: any) {
    console.error("Error importing representatives:", error);
    return NextResponse.json(
      { message: error.message || "حدث خطأ أثناء استيراد البيانات" },
      { status: 500 }
    );
  }
} 
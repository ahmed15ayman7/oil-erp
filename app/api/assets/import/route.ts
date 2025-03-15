import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { $Enums, AssetStatus, AssetType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const REQUIRED_COLUMNS = [
  "اسم الأصل",
  "النوع",
  "القيمة",
  "تاريخ الشراء",
  "موعد الصيانة القادمة",
  "الحالة",
  "الحد الأقصى",
];

const typeMap: Record<string, AssetType> = {
  ماكينة: "MACHINE",
  معدات: "EQUIPMENT",
  مركبة: "VEHICLE",
  أخرى: "OTHER",
};

const statusMap: Record<string, AssetStatus> = {
  نشط: "ACTIVE",
  "في الصيانة": "MAINTENANCE",
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
        { error: "لم يتم تحديد ملف" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json(
        { error: "لم يتم العثور على ورقة عمل" },
        { status: 400 }
      );
    }

    // التحقق من وجود الأعمدة المطلوبة
    const headers = worksheet.getRow(1).values as string[];
    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !headers.includes(col)
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `الأعمدة التالية مطلوبة: ${missingColumns.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // تحويل البيانات
    const assets: { name: string; value: number; type: AssetType; purchaseDate: Date ; nextMaintenance: Date | null; status: $Enums.AssetStatus; maxMaterials: number }[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // تخطي صف العناوين

      const values = row.values as string[];
      const [_, name, type, value, purchaseDate, nextMaintenance, status, maxMaterials] = values;

      if (!name || !type || !value || !status || !purchaseDate || !nextMaintenance || !maxMaterials) return; // تخطي الصفوف الفارغة

      // التحقق من صحة النوع والحالة
      if (!typeMap[type]) {
        throw new Error(
          `نوع غير صالح في الصف ${rowNumber}: ${type}. الأنواع المسموح بها: ${Object.keys(
            typeMap
          ).join(", ")}`
        );
      }

      if (!statusMap[status]) {
        throw new Error(
          `حالة غير صالحة في الصف ${rowNumber}: ${status}. الحالات المسموح بها: ${Object.keys(
            statusMap
          ).join(", ")}`
        );
      }

      assets.push({
        name,
        type: typeMap[type] as AssetType,
        value: parseFloat(value),
        purchaseDate: new Date(purchaseDate),
        nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null,
        status: statusMap[status],
        maxMaterials: parseFloat(maxMaterials),
      });
    });

    // إضافة الأصول للقاعدة البيانات
    const result = await prisma.$transaction(
      assets.map((asset) => prisma.asset.create({ 
        data: {
          ...asset,
          user: { connect: { id: session.user.id } }
        }
      }))
    );

    return NextResponse.json({
      success: true,
      message: `تم استيراد ${result.length} أصل بنجاح`,
    });
  } catch (error) {
    console.error("Error in POST /api/assets/import:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "حدث خطأ أثناء استيراد البيانات",
      },
      { status: 500 }
    );
  }
} 
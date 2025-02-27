import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { Workbook } from "exceljs";
import { Customer } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      return new NextResponse("Invalid Excel file", { status: 400 });
    }

    // استخراج العناوين من الصف الأول
    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.value as string);
    });

    // قراءة البيانات من الصفوف
    const customersData: Record<string, any>[] = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // تخطي الصف الأول (عناوين الأعمدة)

      const rowData: Record<string, any> = {};
      row.eachCell((cell, colIndex) => {
        const header = headers[colIndex - 1]; // تعيين القيم حسب العنوان
        rowData[header] = cell.value;
      });

      customersData.push({
        name: rowData["الاسم"],
        phone: rowData["رقم الهاتف"]?.toString(),
        address: rowData["العنوان"],
        type: rowData["النوع"] === "جملة" ? "WHOLESALE" : "RETAIL",
        taxNumber: rowData["الرقم الضريبي"]?.toString(),
        commercialReg: rowData["السجل التجاري"]?.toString(),
      });
    });

    // إدخال البيانات إلى قاعدة البيانات
    const customers = await prisma.customer.createMany({
      data: customersData as Customer[],
    });

    return NextResponse.json({ success: true, count: customers.count });
  } catch (error) {
    console.error("[CUSTOMERS_IMPORT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

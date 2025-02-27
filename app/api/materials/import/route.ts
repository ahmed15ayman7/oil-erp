import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-response';
import {Workbook} from 'exceljs';
import { PrismaPromise, UnitType } from '@prisma/client';
import { MaterialType } from '@prisma/client';

const REQUIRED_COLUMNS = {
  'اسم المادة': 'name',
  'الكود': 'code',
  'النوع': 'type',
  'وحدة القياس': 'unit',
  'الكمية': 'quantity',
  'الحد الأدنى': 'minQuantity',
  'السعر': 'price',
  'المورد': 'supplier',
  'موقع التخزين': 'location',
  'ملاحظات': 'notes'
};

const TYPE_MAPPING = {
  'مواد خام': 'RAW_MATERIAL',
  'مواد تعبئة': 'PACKAGING',
  'زجاجات': 'BOTTLE',
  'كراتين': 'CARTON'
};

const UNIT_MAPPING = {
  'كيلوجرام': 'KG',
  'جرام': 'GRAM',
  'لتر': 'LITER',
  'قطعة': 'PIECE',
  'صندوق': 'BOX'
};

export async function POST(request: NextRequest) {
  try {
    await getAuthSession();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return handleApiError({
        message: 'الملف مطلوب',
        status: 400
      });
    }

    const buffer = await file.arrayBuffer();
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return handleApiError({
        message: 'لم يتم العثور على ورقة العمل',
        status: 400
      });
    }
    // const jsonData = worksheet.getSheetValues();

    // التحقق من وجود الأعمدة المطلوبة
    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.value as string);
    });
    const missingColumns = Object.keys(REQUIRED_COLUMNS).filter(
      col => !headers.includes(col)
    );

    if (missingColumns.length > 0) {
      return handleApiError({
        message: `الأعمدة التالية مطلوبة: ${missingColumns.join(', ')}`,
        status: 400,
        data: {
          requiredColumns: Object.keys(REQUIRED_COLUMNS),
          missingColumns
        }
      });
    }

    // تحويل البيانات وإجراء التحقق
    const validationErrors: any[] = [];
    const processedData2: Record<string, any>[] = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // تخطي الصف الأول (عناوين الأعمدة)

      const rowData: Record<string, any> = {};
      row.eachCell((cell, colIndex) => {
        const header = headers[colIndex - 1]; // تعيين القيم حسب العنوان
        rowData[header] = cell.value;
      });

      processedData2.push(rowData);
    });
    const processedData = processedData2.map((row: any, index: number) => {
      try {
        const type = TYPE_MAPPING[row['النوع'] as keyof typeof TYPE_MAPPING];
        if (!type) {
          throw new Error(`نوع غير صالح: ${row['النوع']}`);
        }

        const unit = UNIT_MAPPING[row['وحدة القياس'] as keyof typeof UNIT_MAPPING];
        if (!unit) {
          throw new Error(`وحدة قياس غير صالحة: ${row['وحدة القياس']}`);
        }

        return {
          name: row['اسم المادة'],
          code: row['الكود'].toString(),
          type,
          unit,
          quantity: Number(row['الكمية']) || 0,
          minQuantity: Number(row['الحد الأدنى']) || 0,
          price: Number(row['السعر']) || 0,
          supplier: row['المورد'],
          location: row['موقع التخزين'],
          notes: row['ملاحظات']
        };
      } catch (error: any) {
        validationErrors.push({
          row: index + 2, // +2 because Excel starts at 1 and we have headers
          error: error.message
        });
        return null;
      }
    }).filter(Boolean);

    if (validationErrors.length > 0) {
      return handleApiError({
        message: 'يوجد أخطاء في البيانات',
        status: 400,
        data: { validationErrors }
      });
    }

    // التحقق من تكرار الأكواد
    const existingCodes = await prisma.material.findMany({
      where: {
        code: {
          in: processedData.map(d => d?.code)
        }
      },
      select: { code: true }
    });

    if (existingCodes.length > 0) {
      return handleApiError({
        message: 'بعض الأكواد مستخدمة بالفعل',
        status: 400,
        data: {
          duplicateCodes: existingCodes.map(e => e.code)
        }
      });
    }

    // إدخال البيانات
    const materials = await prisma.$transaction(
      processedData.map(data => data ?
        prisma.material.create({
          data: {
            name: data.name,
            code: data.code,
            type: data.type as MaterialType,
            unit: data.unit as UnitType,
            quantity: data.quantity,
            minQuantity: data.minQuantity,
            price: data.price,
            supplier: data.supplier,
            location: data.location,
            notes: data.notes,
            transactions: {   
              create: {
                type: 'IN',
                quantity: data.quantity,
                price: data.price,
                notes: 'رصيد افتتاحي من ملف Excel',
                createdBy: 'SYSTEM'
              }
            }
          }
        }): null
      ).filter(Boolean) as PrismaPromise<any>[]
    );

    return successResponse({
      message: `تم استيراد ${materials.length} مادة بنجاح`,
      materials
    });

  } catch (error) {
    return handleApiError(error);
  }
} 
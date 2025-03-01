import { Customer, CustomerType, Product, Sale } from "@prisma/client";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  model: string;
  status: string;
  lastExpense?: {
    amount: number;
    date: string;
    description: string;
  };
}

export const generateVehicleReport = (vehicles: Vehicle[]) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Enable Arabic language support
  doc.setFont("Arial");
  doc.setR2L(true);

  // Add title
  doc.setFontSize(20);
  doc.text("تقرير المركبات", doc.internal.pageSize.width / 2, 20, {
    align: "center",
  });

  // Create table data
  const tableData = vehicles.map((vehicle) => [
    vehicle.lastExpense
      ? `${vehicle.lastExpense.amount} - ${vehicle.lastExpense.description}`
      : "-",
    vehicle.status,
    vehicle.model,
    vehicle.plateNumber,
    vehicle.name,
  ]);

  // Add table
  (doc as any).autoTable({
    head: [["آخر مصروف", "الحالة", "الموديل", "رقم اللوحة", "الاسم"]],
    body: tableData,
    startY: 30,
    headStyles: { fillColor: [41, 128, 185], halign: "right" },
    bodyStyles: { halign: "right" },
    styles: { font: "Arial", fontSize: 10 },
    theme: "grid",
  });

  // Save the PDF
  doc.save("vehicles-report.pdf");
};

export const generateInventoryReport = (stockMovements: any[]) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add title
  doc.setFontSize(20);
  doc.text("تقرير المخزن", doc.internal.pageSize.width / 2, 20, {
    align: "center",
  });

  // Create table data
  const tableData = stockMovements.map((stockMovement) => [
    stockMovement.product.name,
    stockMovement.type,
    stockMovement.quantity,
    stockMovement.description,
  ]);

  // Add table
  (doc as any).autoTable({
    head: [["اسم المنتج", "نوع المنتج", "الكمية", "وصف"]],
    body: tableData,
    startY: 30,
    headStyles: { fillColor: [41, 128, 185], halign: "right" },
    bodyStyles: { halign: "right" },
    styles: { font: "Arial", fontSize: 10 },
    theme: "grid",
  });

  // Save the PDF
  doc.save("inventory-report.pdf");
};
export let generateCustomerReport = (customers: Customer[]) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add title
  doc.setFontSize(20);
  doc.text("تقرير العملاء", doc.internal.pageSize.width / 2, 20, {
    align: "center",
  });

  // Create table data
  const tableData = customers.map((customer: Customer) => [
    customer.name,
    customer.phone,
    customer.taxNumber || "-",
    customer.address || "-",
    customer.type === "WHOLESALE" ? "جملة" : "قطاعي",
    "0 ج.م",
  ]);

  // Add table
  (doc as any).autoTable({
    head: [
      [
        "الاسم",
        "رقم الهاتف",
        "البريد الإلكتروني",
        "العنوان",
        "النوع",
        "الرصيد",
      ],
    ],
    body: tableData,
    startY: 30,
    headStyles: { fillColor: [41, 128, 185], halign: "right" },
    bodyStyles: { halign: "right" },
    styles: { font: "Arial", fontSize: 10 },
    theme: "grid",
  });

  // Save the PDF
  doc.save("customers-report.pdf");
};
export let generateProductsReport = (products: Product[]) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add title
  doc.setFontSize(20);
  doc.text("تقرير المنتجات", doc.internal.pageSize.width / 2, 20, {
    align: "center",
  });

  // Create table data
  const tableData = products.map((product: Product) => [
    product.name,
    product.description || "-",
    product.price,
    product.quantity,
    product.type,
    product.quantity - product.quantity,
  ]);


  // Add table
  (doc as any).autoTable({
    head: [["اسم المنتج", "الوصف", "السعر", "الكمية", "النوع", "الكمية المتبقية"]],
    body: tableData,
    startY: 30,
    headStyles: { fillColor: [41, 128, 185], halign: "right" },
    bodyStyles: { halign: "right" },
    styles: { font: "Arial", fontSize: 10 },
    theme: "grid",
  });


  // Save the PDF
  doc.save("products-report.pdf");
};

export async function generateSalesReport(sales: (Sale & { 
  items: { 
    productId: string, 
    quantity: number, 
    price: number, 
    total: number,
    product: {
      name: string,
      category: {
        name: string
      }
    }
  }[] 
})[]) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // إعداد الخط العربي
  doc.setFont("Arial");
  doc.setR2L(true);

  // عنوان التقرير
  doc.setFontSize(20);
  doc.text("تقرير المبيعات", doc.internal.pageSize.width / 2, 20, { align: "center" });

  // إعداد الجدول
  const headers = [
    "رقم الفاتورة",
    "التاريخ",
    "العميل",
    "المنتج",
    "الفئة",
    "الكمية",
    "السعر",
    "الإجمالي",
    "حالة الدفع"
  ];

  const data = sales.map((sale) => [
    sale.invoiceNumber,
    new Date(sale.date).toLocaleDateString('ar-EG'),
    sale.customerId,
    sale.items.map(item => item.product.name).join(', '),
    sale.items.map(item => item.product.category.name).join(', '),
    sale.items.reduce((acc, item) => acc + item.quantity, 0),
    sale.items.reduce((acc, item) => acc + item.price, 0).toLocaleString('ar-EG'),
    sale.items.reduce((acc, item) => acc + item.total, 0).toLocaleString('ar-EG'),
    sale.status === 'PAID' ? 'مدفوع' : 'غير مدفوع'
  ]);

  // رسم الجدول
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 30,
    theme: 'grid',
    styles: {
      font: 'Arial',
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'right'
    },
    bodyStyles: {
      halign: 'right'
    },
  });

  // حفظ الملف
  doc.save('تقرير-المبيعات.pdf');
}

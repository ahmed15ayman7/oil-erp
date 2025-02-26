import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Enable Arabic language support
  doc.setFont("Arial");
  doc.setR2L(true);

  // Add title
  doc.setFontSize(20);
  doc.text('تقرير المركبات', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  // Create table data
  const tableData = vehicles.map(vehicle => [
    vehicle.lastExpense ? `${vehicle.lastExpense.amount} - ${vehicle.lastExpense.description}` : '-',
    vehicle.status,
    vehicle.model,
    vehicle.plateNumber,
    vehicle.name,
  ]);

  // Add table
  (doc as any).autoTable({
    head: [[
      'آخر مصروف',
      'الحالة',
      'الموديل',
      'رقم اللوحة',
      'الاسم'
    ]],
    body: tableData,
    startY: 30,
    headStyles: { fillColor: [41, 128, 185], halign: 'right' },
    bodyStyles: { halign: 'right' },
    styles: { font: 'Arial', fontSize: 10 },
    theme: 'grid'
  });

  // Save the PDF
  doc.save('vehicles-report.pdf');
};

export const generateInventoryReport = (stockMovements: any[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(20);
  doc.text('تقرير المخزن', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  // Create table data
  const tableData = stockMovements.map(stockMovement => [
    stockMovement.product.name,
    stockMovement.type,
    stockMovement.quantity,
    stockMovement.description
  ]);

  // Add table
  (doc as any).autoTable({
    head: [[
      'اسم المنتج',
      'نوع المنتج',
      'الكمية',
      'وصف'
    ]],
    body: tableData,
    startY: 30,
    headStyles: { fillColor: [41, 128, 185], halign: 'right' },
    bodyStyles: { halign: 'right' },
    styles: { font: 'Arial', fontSize: 10 },
    theme: 'grid'
  });

  // Save the PDF
  doc.save('inventory-report.pdf');
};
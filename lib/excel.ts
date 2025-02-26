import { Workbook } from 'exceljs';

export const exportToExcel = (data: any[], filename: string) => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  worksheet.addRow(['Code', 'Quantity']);
  data.forEach((row) => {
    worksheet.addRow([row.code, row.quantity]);
  });

  workbook.xlsx.writeFile(`${filename}.xlsx`);
};

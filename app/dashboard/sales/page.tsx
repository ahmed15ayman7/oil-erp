'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { SaleFormDialog } from '@/components/sales/sale-form-dialog';
import { SearchInput } from '@/components/search-input';
import { Box, Chip, Grid, MenuItem, TextField, Button, Paper, Stack } from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { IconFileSpreadsheet, IconPlus, IconPrinter } from '@tabler/icons-react';
import * as ExcelJS from 'exceljs';
import { generateSalesReport } from '@/lib/pdf';
import { Sale } from '@prisma/client';

const columns = [
  { 
    id: 'invoiceNumber', 
    label: 'رقم الفاتورة',
  },
  { 
    id: 'customer', 
    label: 'العميل',
    format: (value: any) => value.name 
  },
  {
    id: 'items',
    label: 'المنتجات',
    format: (value: any[]) => value.map(item => item.product.name).join(', ')
  },
  {
    id: 'items',
    label: 'الفئات',
    format: (value: any[]) => value.map(item => item.product.category.name).join(', ')
  },
  {
    id: 'items',
    label: 'الكمية',
    format: (value: any[]) => value.reduce((acc: number, item: any) => acc + item.quantity, 0).toLocaleString('ar-EG')
  },
  {
    id: 'total',
    label: 'الإجمالي',
    format: (value: number) =>
      value.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }),
  },
  {
    id: 'status',
    label: 'الحالة',
    format: (value: string) => {
      const statusMap = {
        PENDING: { label: 'معلقة', color: 'warning' },
        COMPLETED: { label: 'مكتملة', color: 'success' },
        CANCELLED: { label: 'ملغاة', color: 'error' },
      };
      const status = statusMap[value as keyof typeof statusMap];
      return (
        <Chip
          label={status.label}
          color={status.color as any}
          size="small"
        />
      );
    },
  },
  {
    id: 'createdAt',
    label: 'تاريخ الإنشاء',
    format: (value: string) =>
      new Date(value).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
  },
];

export default function SalesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sales, setSales] = useState([]);
  const api = useApi();

  const {
    data,
    isLoading,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ['sales', page, rowsPerPage, searchQuery],
    queryFn: () =>
      api.get(
        `/api/sales?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}`
      ),
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const response = await fetch("/api/sales");
    const data = await response.json();
    setSales(data);
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("المبيعات");

    // تعيين اتجاه الورقة من اليمين إلى اليسار
    worksheet.views = [{ rightToLeft: true }];

    // تعريف الأعمدة
    worksheet.columns = [
      { header: "رقم الفاتورة", key: "invoiceNumber", width: 15 },
      { header: "التاريخ", key: "date", width: 15 },
      { header: "العميل", key: "customer", width: 30 },
      { header: "المنتج", key: "product", width: 30 },
      { header: "الفئة", key: "category", width: 20 },
      { header: "الكمية", key: "quantity", width: 15 },
      { header: "السعر", key: "price", width: 15 },
      { header: "الإجمالي", key: "total", width: 15 },
      { header: "حالة الدفع", key: "paymentStatus", width: 15 },
    ];

    // إضافة البيانات
    sales.forEach((sale: Sale & { 
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
    }) => {
      worksheet.addRow({
        invoiceNumber: sale.invoiceNumber,
        date: new Date(sale.date).toLocaleDateString('ar-EG'),
        customer: sale.customerId,
        product: sale.items.map(item => item.product.name).join(', '),
        category: sale.items.map(item => item.product.category.name).join(', '),
        quantity: sale.items.reduce((acc, item) => acc + item.quantity, 0),
        price: sale.items.reduce((acc, item) => acc + item.price, 0),
        total: sale.items.reduce((acc, item) => acc + item.total, 0),
        paymentStatus: sale.status === 'PAID' ? 'مدفوع' : 'غير مدفوع',
      });
    });

    // تنسيق الخلايا
    worksheet.getRow(1).font = { bold: true, size: 14 };

    // تصدير الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "المبيعات.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printPDF = async () => {
    await generateSalesReport(sales);
  };

  const handleAdd = () => {
    setSelectedSale(null);
    setFormOpen(true);
  };

  const handleEdit = (sale: any) => {
    setSelectedSale(sale);
    setFormOpen(true);
  };

  const handleDelete = (sale: any) => {
    setSelectedSale(sale);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (selectedSale) {
        await api.put(`/api/sales`, {
          ...formData,
          id: selectedSale.id,
        }, {
          successMessage: 'تم تحديث الفاتورة بنجاح',
        });
      } else {
        await api.post('/api/sales', formData, {
          successMessage: 'تم إضافة الفاتورة بنجاح',
        });
      }
      setFormOpen(false);
      refetchSales();
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/api/sales?id=${selectedSale.id}`, {
        successMessage: 'تم حذف الفاتورة بنجاح',
      });
      setDeleteDialogOpen(false);
      refetchSales();
    } finally {
      setFormLoading(false);
    }
  };



  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المبيعات"
        onAdd={handleAdd}
        actions={
          <div className="flex gap-2">
            <Button variant="contained" startIcon={<IconPlus />} onClick={handleAdd}>إضافة فاتورة</Button>
            <Button variant="outlined" startIcon={<IconFileSpreadsheet />} onClick={exportToExcel}>تصدير Excel</Button>
            <Button variant="outlined" startIcon={<IconPrinter />} onClick={printPDF}>طباعة PDF</Button>
          </div>
        }
      />

      <Box className="mb-6">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <SearchInput
              onSearch={setSearchQuery}
              placeholder="البحث في الفواتير..."
            />
          </Grid>
        </Grid>
      </Box>

      {isLoading ? (
        <Loading />
      ) : (
        <DataTable
          columns={columns}
          data={data?.sales || []}
          loading={isLoading}
          page={page}
          totalCount={data?.total || 0}
          rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <SaleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedSale}
        loading={formLoading}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="حذف الفاتورة"
        message={`هل أنت متأكد من حذف الفاتورة رقم "${selectedSale?.id}"؟`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={formLoading}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { SearchInput } from '@/components/search-input';
import { Box, Chip, Grid, MenuItem, TextField, Button, Paper, Stack } from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { IconFileSpreadsheet, IconPlus, IconPrinter } from "@tabler/icons-react";
import * as ExcelJS from "exceljs";
import { generateProductsReport } from "@/lib/pdf";
import { Product } from '@prisma/client';

const columns = [
  {
    id: 'code',
    label: 'الكود',
  },
  {
    id: 'name',
    label: 'الاسم',
  },
  {
    id: 'category',
    label: 'الفئة',
    format: (value: any) => value?.name || 'غير محدد',
  },
  {
    id: 'unit',
    label: 'الوحدة',
    format: (value: any) => value?.name || 'غير محدد',
  },
  {
    id: 'price',
    label: 'السعر',
    format: (value: number) => value.toLocaleString('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }),
  },
  {
    id: 'quantity',
    label: 'الكمية',
    format: (value: number) => value.toLocaleString('ar-EG'),
  },
  {
    id: 'quantity',
    label: 'عددالكراتين',
    format: (value: number) => (value/12).toLocaleString('ar-EG'),
  },
  {
    id: 'stockValue',
    label: 'قيمة المخزون',
    format: (value: number) => value.toLocaleString('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }),
  },
  {
    id: 'status',
    label: 'الحالة',
    format: (value: string) => {
      const statusMap = {
        IN_STOCK: { label: 'متوفر', color: 'success' },
        LOW_STOCK: { label: 'منخفض', color: 'warning' },
        OUT_OF_STOCK: { label: 'نفذ', color: 'error' },
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
];

export default function ProductsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const api = useApi();

  // Fetch products
  const {
    data,
    isLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', page, rowsPerPage, searchQuery, selectedCategory],
    queryFn: () =>
      api.get(
        `/api/products?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}&category=${selectedCategory}`
      ),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories'),
  });

  useEffect(() => {
    refetchProducts();
  }, [searchQuery, page, rowsPerPage, selectedCategory]);


  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("المنتجات");

    // تعيين اتجاه الورقة من اليمين إلى اليسار
    worksheet.views = [{ rightToLeft: true }];

    // تعريف الأعمدة
    worksheet.columns = [
      { header: "اسم المنتج", key: "name", width: 30 },
      { header: "السعر", key: "price", width: 15 },
      { header: "الكمية المتاحة", key: "quantity", width: 15 },
    ];

    // إضافة البيانات
    data?.products.forEach((product: Product) => {
      worksheet.addRow({
        name: product.name,
        price: product.price,
        quantity: product.quantity,
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
    a.download = "المنتجات.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printPDF = async () => {
    await generateProductsReport(data?.products);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleDelete = (product: any) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (selectedProduct) {
        await api.put('/api/products', {
          ...formData,
          id: selectedProduct.id,
        }, {
          successMessage: 'تم تحديث المنتج بنجاح',
        });
      } else {
        await api.post('/api/products', formData, {
          successMessage: 'تم إضافة المنتج بنجاح',
        });
      }
      setFormOpen(false);
      refetchProducts();
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/api/products?id=${selectedProduct.id}`, {
        successMessage: 'تم حذف المنتج بنجاح',
      });
      setDeleteDialogOpen(false);
      refetchProducts();
    } finally {
      setFormLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المنتجات"
        actions={
          <div className="flex gap-2">
            <Button
              variant="contained"
              startIcon={<IconPlus />}
              onClick={handleAdd}
            >
              إضافة منتج
            </Button>
            <Button
            variant="outlined"
            startIcon={<IconFileSpreadsheet />}
            onClick={exportToExcel}
          >
            تصدير Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<IconPrinter />}
            onClick={printPDF}
          >
            طباعة PDF
          </Button>
          </div>
        }
      />

      <Box className="mb-6">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <SearchInput
              onSearch={setSearchQuery}
              placeholder="البحث في المنتجات..."
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="الفئة"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="">الكل</MenuItem>
              {categoriesData?.categories.map((category: any) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Box>


      {isLoading ? <Loading /> : data && <DataTable
        columns={columns}
        data={data?.products || []}
        loading={isLoading}
        page={page}
        totalCount={data?.total || 0}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />}

      {!isLoading && data && (
        <ProductFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={selectedProduct}
          loading={formLoading}
        />
      )}

      {!isLoading && data && (
        <ConfirmDialog
          open={deleteDialogOpen}
        title="حذف المنتج"
          message={`هل أنت متأكد من حذف المنتج "${selectedProduct?.name}"؟`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
          loading={formLoading}
        />
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { SearchInput } from '@/components/search-input';
import { StockMovementDialog } from '@/components/inventory/stock-movement-dialog';
import { ExcelImportDialog } from '@/components/inventory/excel-import-dialog';
import { 
  Box, 
  Button, 
  Chip, 
  Grid, 
  MenuItem, 
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { 
  IconFileExport, 
  IconFileImport, 
  IconHistory,
  IconPrinter,
} from '@tabler/icons-react';
import { exportToExcel } from '@/lib/excel';
import { generateInventoryReport } from '@/lib/pdf';

const columns = [
  {
    id: 'code',
    label: 'الكود',
  },
  {
    id: 'name',
    label: 'اسم المنتج',
  },
  {
    id: 'type',
    label: 'النوع',
    format: (value: string) => {
      const typeMap = {
        RAW_MATERIAL: 'مواد خام',
        FINISHED_PRODUCT: 'منتج نهائي',
        PACKAGING: 'مواد تغليف',
        BOTTLE: 'زجاجات',
        CARTON: 'كراتين',
      };
      return typeMap[value as keyof typeof typeMap] || value;
    },
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
    id: 'quantity',
    label: 'الكمية',
    format: (value: number) => value.toLocaleString('ar-EG'),
  },
  {
    id: 'minQuantity',
    label: 'الحد الأدنى',
    format: (value: number) => value.toLocaleString('ar-EG'),
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
  {
    id: 'stockValue',
    label: 'قيمة المخزون',
    format: (value: number) => value.toLocaleString('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }),
  },
];

export default function InventoryPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const api = useApi();

  // Fetch products
  const {
    data,
    isLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', page, rowsPerPage, searchQuery, selectedType, selectedCategory],
    queryFn: () =>
      api.get(
        `/api/products?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}&type=${selectedType}&category=${selectedCategory}`
      ),
  });
useEffect(() => {
  refetchProducts();
}, [searchQuery, page, rowsPerPage, selectedType, selectedCategory]);
  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories'),
  });

  const handleMovement = (product: any) => {
    setSelectedProduct(product);
    setMovementDialogOpen(true);
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.put('/api/stock-movements', {
        type: selectedType,
        category: selectedCategory,
      });
      
      await exportToExcel(response.data, 'تقرير المخزون');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const handlePrint = async () => {
    try {
      const response = await api.put('/api/stock-movements', {
        type: selectedType,
        category: selectedCategory,
      });
      
      await generateInventoryReport(response.data);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المنتجات النهائية"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outlined"
              startIcon={<IconFileImport />}
              onClick={() => setImportDialogOpen(true)}
            >
              استيراد
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconFileExport />}
              onClick={handleExportExcel}
            >
              تصدير
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconPrinter />}
              onClick={handlePrint}
            >
              طباعة
            </Button>
          </div>
        }
      />

      <Box className="mb-6">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <SearchInput
              onSearch={setSearchQuery}
              placeholder="البحث في المنتجات..."
            />
          </Grid>
          <Grid item xs={12} sm={3}>
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
        additionalActions={[
          // {
          //   icon: <IconHistory />,
          //   label: 'حركة المخزون',
          //   onClick: handleMovement,
          // },
        ]}
      />}

      {isLoading ? <Loading /> : data && (
        <StockMovementDialog
          open={movementDialogOpen}
          onClose={() => setMovementDialogOpen(false)}
          product={selectedProduct}
          onSuccess={refetchProducts}
        />
      )}

      {isLoading ? <Loading /> : data && (
          <ExcelImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSuccess={refetchProducts}
        />
      )}
    </div>
  );
}

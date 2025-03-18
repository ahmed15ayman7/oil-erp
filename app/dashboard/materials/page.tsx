'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { Box, Button, Chip, Grid } from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { IconFileExport, IconHistory, IconPlus, IconExchange } from '@tabler/icons-react';
import { SearchInput } from '@/components/search-input';
import { MaterialFormDialog } from '@/components/materials/material-form-dialog';
import { StockMovementDialog } from '@/components/inventory/stock-movement-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ImportDialog } from '@/components/materials/import-dialog';
import { ProductConversionDialog } from '@/app/components/materials/product-conversion-dialog';

interface Column {
  id: string;
  label: string;
  format?: (value: any, row?: any) => string | JSX.Element;
}
const UNIT_MAPPING = {
  KG: 'كيلوجرام',
  GRAM: 'جرام',
  LITER: 'لتر',
  PIECE: 'قطعة',
  BOX: 'صندوق',
  TONNE:"طن"
};
const columns: Column[] = [
  { 
    id: 'code', 
    label: 'الكود',
  },
  { 
    id: 'name', 
    label: 'اسم المادة',
  },
  {
    id: 'type',
    label: 'النوع',
    format: (value: string) => {
      const typeMap = {
        RAW_MATERIAL: { label: 'مواد خام', color: 'primary' },
        PACKAGING: { label: 'مواد تعبئة', color: 'secondary' },
        BOTTLE: { label: 'زجاجات', color: 'success' },
        CARTON: { label: 'كراتين', color: 'info' },
        BOTTLE_CAP: { label: 'غطاء الزجاجة', color: 'warning' },
        SLEEVE: { label: 'سليف', color: 'error' },
        TAPE: { label: 'لزق', color: 'default' }
      };
      const type = typeMap[value as keyof typeof typeMap];
      return <Chip label={type.label} color={type.color as any} size="small" />;
    },
  },
  {
    id: 'quantity',
    label: 'الكمية المتوفرة',
    format: (value: number, row: any) => `${value}`,
  },
  {
    id: 'unit',
    label: 'الوحدة',
    format: (value: string, row: any) => UNIT_MAPPING[value as keyof typeof UNIT_MAPPING] || row?.unit,
  },
  {
    id: 'minQuantity',
    label: 'الحد الأدنى',
    format: (value: number, row: any) => `${value}`,
  },
  {
    id: 'price',
    label: 'السعر',
    format: (value: number) => 
      value.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }),
  },
  {
    id: 'warehouse',
    label: 'موقع التخزين',
    format: (value: {name:string}) => 
      value.name
  },
];
export default function MaterialsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const api = useApi();
  
  const {
    data,
    isLoading,
    refetch: refetchMaterials,
  } = useQuery({
    queryKey: ['materials', page, rowsPerPage, searchQuery],
    queryFn: () =>
      api.get(
        `/api/materials?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}`
      ),
    });
    
    console.log(data)
  useEffect(() => {
    refetchMaterials();
  }, [searchQuery, page, rowsPerPage]);

  const handleAdd = () => {
    setSelectedMaterial(null);
    setFormOpen(true);
  };

  const handleEdit = (material: any) => {
    setSelectedMaterial(material);
    setFormOpen(true);
  };

  const handleDelete = (material: any) => {
    setSelectedMaterial(material);
    setDeleteDialogOpen(true);
  };

  const handleMovement = (material: any) => {
    setSelectedMaterial(material);
    setMovementDialogOpen(true);
  };

  const handleConversion = (material: any) => {
    setSelectedMaterial(material);
    setConversionDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (selectedMaterial) {
        await api.put('/api/materials', {
          ...formData,
          id: selectedMaterial.id,
        }, {
          successMessage: 'تم تحديث المادة بنجاح',
        });
      } else {
        await api.post('/api/materials', formData, {
          successMessage: 'تم إضافة المادة بنجاح',
        });
      }
      setFormOpen(false);
      setSelectedMaterial(null);
      refetchMaterials();
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/api/materials?id=${selectedMaterial.id}`, {
        successMessage: 'تم حذف المادة بنجاح',
      });
      setDeleteDialogOpen(false);
      refetchMaterials();
    } finally {
      setFormLoading(false);
    }
  };


  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="إدارة المواد"
        actions={
          <div className="flex gap-2">
            <Button
              variant="contained"
              startIcon={<IconPlus />}
              onClick={handleAdd}
            >
              إضافة مادة
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconFileExport />}
              onClick={() => setImportDialogOpen(true)}
            >
              استيراد من Excel
            </Button>
          </div>
        }
      />

      <Box className="flex gap-2 mb-4">
      <SearchInput
          onSearch={setSearchQuery}
          placeholder="البحث في المواد..."
        />
      </Box>

      {isLoading ? <Loading /> : data && <DataTable
        columns={columns}
        data={data?.materials || []}
        totalCount={data?.totalRows || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        additionalActions={[
          // {
          //   icon: <IconHistory />,
          //   label: 'حركة المخزون',
          //   onClick: handleMovement,
          // },
          {
            icon: <IconExchange />,
            label: 'تحويل إلى منتج',
            onClick: handleConversion,
            show: (row: any) => row.type === 'RAW_MATERIAL',
          },
        ]}
      />}

      {!isLoading && data && (
        <MaterialFormDialog
          open={formOpen}
          onClose={() => {
            setSelectedMaterial(null)
            setFormOpen(false)
          }}
          onSubmit={handleFormSubmit}
          initialData={selectedMaterial}
        />
      )}

      {!isLoading && data && (
        <StockMovementDialog
          open={movementDialogOpen}
          onClose={() => setMovementDialogOpen(false)}
          product={selectedMaterial}
          onSuccess={refetchMaterials}
        />
      )}

      {!isLoading && data && (
        <ConfirmDialog
          open={deleteDialogOpen}
          title="حذف المادة"
          message={`هل أنت متأكد من حذف المادة "${selectedMaterial?.name}"؟`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
          loading={formLoading}
        />
      )}

      {!isLoading && data && (
        <ImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSuccess={refetchMaterials}
        />
      )}

      {!isLoading && data && (
          <ProductConversionDialog
          open={conversionDialogOpen}
          onClose={() => setConversionDialogOpen(false)}
          material={selectedMaterial}
          onSuccess={refetchMaterials}
        />
      )}
    </div>
  );
} 
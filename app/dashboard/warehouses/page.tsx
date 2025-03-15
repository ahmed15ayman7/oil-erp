'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { Box, Button, Chip } from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { IconEdit, IconFileExport, IconTrash, IconPlus } from '@tabler/icons-react';
import { SearchInput } from '@/components/search-input';
import { WarehouseFormDialog } from '@/components/warehouses/warehouse-form-dialog';

const columns = [
  { 
    id: 'name', 
    label: 'اسم المخزن',
  },
  {
    id: 'type',
    label: 'النوع',
    format: (value: string) => {
      const typeMap = {
        RAW_MATERIALS: { label: 'مواد خام', color: 'primary' },
        BOTTLES: { label: 'زجاجات', color: 'secondary' },
        CARTONS: { label: 'كراتين', color: 'success' },
        FINISHED_PRODUCTS: { label: 'منتجات نهائية', color: 'info' },
      };
      const type = typeMap[value as keyof typeof typeMap];
      return <Chip label={type.label} color={type.color as any} size="small" />;
    },
  },
  {
    id: 'location',
    label: 'الموقع',
  },
  {
    id: 'itemsCount',
    label: 'عدد الأصناف',
  },
];

export default function WarehousesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const api = useApi();

  const {
    data,
    isLoading,
    refetch: refetchWarehouses,
  } = useQuery({
    queryKey: ['warehouses', page, rowsPerPage, searchQuery],
    queryFn: () =>
      api.get(
        `/api/warehouses?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}`
      ),
  });
  useEffect(() => {
    refetchWarehouses();
  }, [searchQuery, page, rowsPerPage]);

  const handleAdd = () => {
    setSelectedWarehouse(null);
    setFormOpen(true);
  };

  const handleEdit = (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleDelete = async (warehouse: any) => {
    try {
      await api.delete(`/api/warehouses?id=${warehouse.id}`, {
        successMessage: 'تم حذف المخزن بنجاح',
      });
    } catch (error) {
      console.error('Error deleting warehouse:', error);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (selectedWarehouse) {
        await api.put('/api/warehouses', {
          ...formData,
          id: selectedWarehouse.id,
        }, {
          successMessage: 'تم تحديث المخزن بنجاح',
        });
      } else {
        await api.post('/api/warehouses', formData, {
          successMessage: 'تم إضافة المخزن بنجاح',
        });
      }
      setFormOpen(false);
      refetchWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
    }
  };


  return (
    <div className="space-y-4 p-8">
      <PageHeader
        title="إدارة المخازن"
        actions={
          <div className="flex gap-2">
            <Button
              variant="contained"
              startIcon={<IconPlus />}
              onClick={handleAdd}
            >
              إضافة مخزن
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconFileExport />}
              onClick={() => {/* تصدير البيانات */}}
            >
              تصدير
            </Button>
          </div>
        }
      />

      <Box className="flex gap-2 mb-4">
      <SearchInput
          onSearch={setSearchQuery}
          placeholder="البحث في المخازن..."
        />
      </Box>

      {isLoading ? (
        <Loading />
      ) : data && (
        <DataTable
          columns={columns}
          data={data?.warehouses || []}
          totalCount={data?.totalRows || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
        additionalActions={[
          {
            icon: <IconEdit />,
            label: 'تعديل',
            onClick: handleEdit,
          },
          {
            icon: <IconTrash />,
            label: 'حذف',
            onClick: handleDelete,
          },
        ]}
      />
      )}
      {!isLoading && data && (
      <WarehouseFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedWarehouse}
      />
      )}
    </div>
  );
} 
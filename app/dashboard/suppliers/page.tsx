'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { SupplierFormDialog } from '@/components/suppliers/supplier-form-dialog';
import { SearchInput } from '@/components/search-input';
import { Box, Chip } from '@mui/material';
import { useApi } from '@/hooks/use-api';

const columns = [
  { 
    id: 'name', 
    label: 'الاسم',
  },
  {
    id: 'phone',
    label: 'رقم الهاتف',
  },
  {
    id: 'address',
    label: 'العنوان',
  },
  {
    id: 'isActive',
    label: 'الحالة',
    format: (value: string) => {
      const typeMap = {
        true: { label: 'نشط', color: 'success' },
        false: { label: 'غير نشط', color: 'error' },
      };
      const type = typeMap[value as keyof typeof typeMap];
      return (
        <Chip
          label={type.label}
          color={type.color as any}
          size="small"
        />
      );
    },
  },
  {
    id: 'balance',
    label: 'الرصيد المستحق',
    format: (value: number) =>
      value.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }),
  },
  {
    id: 'lastPurchaseDate',
    label: 'آخر توريد',
    format: (value: string) =>
      value
        ? new Date(value).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'لا يوجد',
  },
];

export default function SuppliersPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const api = useApi();

  const {
    data,
    isLoading,
    refetch: refetchSuppliers,
  } = useQuery({
    queryKey: ['suppliers', page, rowsPerPage, searchQuery],
    queryFn: () =>
      api.get(
        `/api/suppliers?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}`
      ),
  });

  const handleAdd = () => {
    setSelectedSupplier(null);
    setFormOpen(true);
  };

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormOpen(true);
  };

  const handleDelete = (supplier: any) => {
    setSelectedSupplier(supplier);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (selectedSupplier) {
        await api.put('/api/suppliers', {
          ...formData,
          id: selectedSupplier.id,
        }, {
          successMessage: 'تم تحديث المورد بنجاح',
        });
      } else {
        await api.post('/api/suppliers', formData, {
          successMessage: 'تم إضافة المورد بنجاح',
        });
      }
      setFormOpen(false);
      refetchSuppliers();
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/api/suppliers?id=${selectedSupplier.id}`, {
        successMessage: 'تم حذف المورد بنجاح',
      });
      setDeleteDialogOpen(false);
      refetchSuppliers();
    } finally {
      setFormLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الموردين"
        onAdd={handleAdd}
        addLabel="إضافة مورد"
      />

      <Box className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="البحث في الموردين..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={data?.suppliers || []}
        loading={isLoading}
        page={page}
        totalCount={data?.total || 0}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SupplierFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedSupplier}
        loading={formLoading}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="حذف المورد"
        message={`هل أنت متأكد من حذف المورد "${selectedSupplier?.name}"؟`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={formLoading}
      />
    </div>
  );
}

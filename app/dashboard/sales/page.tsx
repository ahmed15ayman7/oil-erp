'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { SaleFormDialog } from '@/components/sales/sale-form-dialog';
import { SearchInput } from '@/components/search-input';
import { useApi } from '@/hooks/use-api';
import { Box, Chip } from '@mui/material';

const columns = [
  { 
    id: 'customer', 
    label: 'العميل',
    format: (value: any) => value.name 
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

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المبيعات"
        onAdd={handleAdd}
        addLabel="إضافة فاتورة"
      />

      <Box className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="البحث في الفواتير..."
        />
      </Box>

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

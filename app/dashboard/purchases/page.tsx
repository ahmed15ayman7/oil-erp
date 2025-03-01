'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PurchaseFormDialog } from '@/components/purchases/purchase-form-dialog';
import { SearchInput } from '@/components/search-input';
import { Box, Chip } from '@mui/material';
import { useApi } from '@/hooks/use-api';

const columns = [
  { 
    id: 'supplier', 
    label: 'المورد',
    format: (value: any) => value.name 
  },
  {
    id: 'invoiceNumber',
    label: 'رقم الفاتورة',
  },
  {
    id: 'date',
    label: 'تاريخ الفاتورة',
    format: (value: string) =>
      new Date(value).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
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
    id: 'paymentStatus',
    label: 'حالة الدفع',
    format: (value: string) => {
      const statusMap = {
        PAID: { label: 'مدفوع', color: 'success' },
        PARTIALLY_PAID: { label: 'مدفوع جزئياً', color: 'warning' },
        UNPAID: { label: 'غير مدفوع', color: 'error' },
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
    id: 'deliveryStatus',
    label: 'حالة التوريد',
    format: (value: string) => {
      const statusMap = {
        DELIVERED: { label: 'تم التوريد', color: 'success' },
        PARTIALLY_DELIVERED: { label: 'توريد جزئي', color: 'warning' },
        PENDING: { label: 'قيد الانتظار', color: 'info' },
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
    id: 'dueDate',
    label: 'تاريخ الاستحقاق',
    format: (value: string) =>
      value
        ? new Date(value).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'غير محدد',
  },
];

export default function PurchasesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const api = useApi();

  const {
    data,
    isLoading,
    refetch: refetchPurchases,
  } = useQuery({
    queryKey: ['purchases', page, rowsPerPage, searchQuery],
    queryFn: () =>
      api.get(
        `/api/purchases?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}`
      ),
  });

  const handleAdd = () => {
    setSelectedPurchase(null);
    setFormOpen(true);
  };

  const handleEdit = (purchase: any) => {
    setSelectedPurchase(purchase);
    setFormOpen(true);
  };

  const handleDelete = (purchase: any) => {
    setSelectedPurchase(purchase);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (selectedPurchase) {
        await api.put('/api/purchases', {
          ...formData,
          id: selectedPurchase.id,
        }, {
          successMessage: 'تم تحديث المشتريات بنجاح',
        });
      } else {
        await api.post('/api/purchases', formData, {
          successMessage: 'تم إضافة المشتريات بنجاح',
        });
      }
      setFormOpen(false);
      refetchPurchases();
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/api/purchases?id=${selectedPurchase.id}`, {
        successMessage: 'تم حذف المشتريات بنجاح',
      });
      setDeleteDialogOpen(false);
      refetchPurchases();
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المشتريات"
        onAdd={handleAdd}
        addLabel="إضافة فاتورة مشتريات"
      />

      <Box className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="البحث في المشتريات..."
        />
      </Box>

     {isLoading?<Loading/>: <DataTable
        columns={columns}
        data={data?.purchases || []}
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
        <PurchaseFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={selectedPurchase}
          loading={formLoading}
        />
      )}

      {!isLoading && data && (
        <ConfirmDialog
          open={deleteDialogOpen}
        title="حذف المشتريات"
        message={`هل أنت متأكد من حذف فاتورة المشتريات رقم "${selectedPurchase?.invoiceNumber}"؟`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={formLoading}
      />
      )}
    </div>
  );
}

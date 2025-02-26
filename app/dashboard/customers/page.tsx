'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { SearchInput } from '@/components/search-input';
import { Box, Chip } from '@mui/material';

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
    id: 'email',
    label: 'البريد الإلكتروني',
  },
  {
    id: 'address',
    label: 'العنوان',
  },
  {
    id: 'type',
    label: 'النوع',
    format: (value: string) => {
      const typeMap = {
        INDIVIDUAL: { label: 'فرد', color: 'primary' },
        COMPANY: { label: 'شركة', color: 'secondary' },
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
    label: 'الرصيد',
    format: (value: number) =>
      value.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }),
  },
];

export default function CustomersPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers', page, rowsPerPage, searchQuery],
    queryFn: () =>
      fetch(
        `/api/customers?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}`
      ).then((res) => res.json()),
  });

  const handleAdd = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleDelete = (customer: any) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (selectedCustomer) {
        await fetch('/api/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            id: selectedCustomer.id,
          }),
        });
      } else {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setFormOpen(false);
      refetchCustomers();
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await fetch(`/api/customers?id=${selectedCustomer.id}`, {
        method: 'DELETE',
      });
      setDeleteDialogOpen(false);
      refetchCustomers();
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
        title="إدارة العملاء"
        onAdd={handleAdd}
        addLabel="إضافة عميل"
      />

      <Box className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="البحث في العملاء..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={data?.customers || []}
        loading={isLoading}
        page={page}
        totalCount={data?.total || 0}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CustomerFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedCustomer}
        loading={formLoading}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="حذف العميل"
        message={`هل أنت متأكد من حذف العميل "${selectedCustomer?.name}"؟`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={formLoading}
      />
    </div>
  );
}

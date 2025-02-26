'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { VehicleFormDialog } from '@/components/transport/vehicle-form-dialog';
import { SearchInput } from '@/components/search-input';
import { Box, Chip, Button, Grid } from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { IconTruck, IconTool } from '@tabler/icons-react';
import { MaintenanceFormDialog } from '@/components/transport/maintenance-form-dialog';

const columns = [
  { 
    id: 'plateNumber', 
    label: 'رقم اللوحة',
  },
  {
    id: 'model',
    label: 'الموديل',
  },
  {
    id: 'type',
    label: 'النوع',
    format: (value: string) => {
      const typeMap = {
        TRUCK: { label: 'شاحنة', color: 'primary' },
        VAN: { label: 'فان', color: 'secondary' },
        PICKUP: { label: 'بيك أب', color: 'info' },
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
    id: 'capacity',
    label: 'السعة (طن)',
    format: (value: number) => value.toLocaleString('ar-EG'),
  },
  {
    id: 'driver',
    label: 'السائق',
    format: (value: any) => value?.name || 'غير محدد',
  },
  {
    id: 'status',
    label: 'الحالة',
    format: (value: string) => {
      const statusMap = {
        ACTIVE: { label: 'نشط', color: 'success' },
        MAINTENANCE: { label: 'صيانة', color: 'warning' },
        INACTIVE: { label: 'غير نشط', color: 'error' },
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
    id: 'lastMaintenance',
    label: 'آخر صيانة',
    format: (value: string) =>
      value
        ? new Date(value).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'لا يوجد',
  },
  {
    id: 'nextMaintenance',
    label: 'الصيانة القادمة',
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

export default function TransportPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const api = useApi();

  const {
    data,
    isLoading,
    refetch: refetchVehicles,
  } = useQuery({
    queryKey: ['vehicles', page, rowsPerPage, searchQuery],
    queryFn: () =>
      api.get(
        `/api/vehicles?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}`
      ),
  });

  const handleAdd = () => {
    setSelectedVehicle(null);
    setFormOpen(true);
  };

  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setFormOpen(true);
  };

  const handleDelete = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setDeleteDialogOpen(true);
  };

  const handleAddMaintenance = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setMaintenanceFormOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (selectedVehicle) {
        await api.put('/api/vehicles', {
          ...formData,
          id: selectedVehicle.id,
        }, {
          successMessage: 'تم تحديث المركبة بنجاح',
        });
      } else {
        await api.post('/api/vehicles', formData, {
          successMessage: 'تم إضافة المركبة بنجاح',
        });
      }
      setFormOpen(false);
      refetchVehicles();
    } finally {
      setFormLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      await api.post('/api/maintenance', {
        ...formData,
        vehicleId: selectedVehicle.id,
      }, {
        successMessage: 'تم إضافة سجل الصيانة بنجاح',
      });
      setMaintenanceFormOpen(false);
      refetchVehicles();
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/api/vehicles?id=${selectedVehicle.id}`, {
        successMessage: 'تم حذف المركبة بنجاح',
      });
      setDeleteDialogOpen(false);
      refetchVehicles();
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
        title="إدارة النقل"
        onAdd={handleAdd}
        addLabel="إضافة مركبة"
      />

      <Box className="mb-6">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <SearchInput
              onSearch={setSearchQuery}
              placeholder="البحث في المركبات..."
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              startIcon={<IconTool />}
              fullWidth
              onClick={() => setMaintenanceFormOpen(true)}
            >
              إضافة صيانة
            </Button>
          </Grid>
        </Grid>
      </Box>

      <DataTable
        columns={columns}
        data={data?.vehicles || []}
        loading={isLoading}
        page={page}
        totalCount={data?.total || 0}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
        additionalActions={[
          {
            icon: <IconTool />,
            label: 'إضافة صيانة',
            onClick: handleAddMaintenance,
          },
        ]}
      />

      <VehicleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedVehicle}
        loading={formLoading}
      />

      <MaintenanceFormDialog
        open={maintenanceFormOpen}
        onClose={() => setMaintenanceFormOpen(false)}
        onSubmit={handleMaintenanceSubmit}
        vehicle={selectedVehicle}
        loading={formLoading}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="حذف المركبة"
        message={`هل أنت متأكد من حذف المركبة رقم "${selectedVehicle?.plateNumber}"؟`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={formLoading}
      />
    </div>
  );
}

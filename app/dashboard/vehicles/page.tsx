'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { SearchInput } from '@/components/search-input';
import { VehicleDialog } from '@/components/vehicles/vehicle-dialog';
import { ExpenseDialog } from '@/components/vehicles/expense-dialog';
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
  IconCar,
  IconFileExport, 
  IconReportMoney,
  IconPrinter,
  IconTool,
} from '@tabler/icons-react';
import { exportToExcel } from '@/lib/excel';
import { generateVehicleReport } from '@/lib/pdf';
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
    id: 'capacity',
    label: 'السعة',
    format: (value: number) => value.toLocaleString('ar-EG'),
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
    id: 'lastExpense',
    label: 'آخر مصروف',
    format: (value: any) => {
      if (!value || !value.length) return 'لا يوجد';
      const expense = value[0];
      return `${expense.amount.toLocaleString('ar-EG')} جنيه - ${
        expense.type === 'FUEL' ? 'وقود' :
        expense.type === 'MAINTENANCE' ? 'صيانة' :
        expense.type === 'OIL_CHANGE' ? 'تغيير زيت' :
        expense.type === 'TIRES' ? 'إطارات' :
        expense.type === 'INSURANCE' ? 'تأمين' : 'أخرى'
      }`;
    },
  },
];

export default function VehiclesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const api = useApi();
  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);


  // Fetch vehicles
  const {
    data,
    isLoading,
    refetch: refetchVehicles,
  } = useQuery({
    queryKey: ['vehicles', page, rowsPerPage, searchQuery, selectedStatus],
    queryFn: () =>
      api.get(
        `/api/vehicles?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}&status=${selectedStatus}`
      ),
  });

  const handleAdd = () => {
    setSelectedVehicle(null);
    setVehicleDialogOpen(true);
  };

  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setVehicleDialogOpen(true);
  };

  const handleAddExpense = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setExpenseDialogOpen(true);
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.patch('/api/vehicle-expenses', {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        endDate: new Date().toISOString(),
      });
      
      await exportToExcel(response.data, 'تقرير مصاريف المركبات');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const handlePrint = async () => {
    try {
      const response = await api.patch('/api/vehicle-expenses', {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        endDate: new Date().toISOString(),
      });
      
      await generateVehicleReport(response.data);
    } catch (error) {
      console.error('Error generating PDF:', error);
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
  const handleAddMaintenance = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setMaintenanceFormOpen(true);
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة النقل"
        actions={
          <div className="flex gap-2">
            <Button
              variant="contained"
              startIcon={<IconCar />}
              onClick={handleAdd}
            >
              إضافة مركبة
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
          <Grid item xs={12} sm={8}>
            <SearchInput
              onSearch={setSearchQuery}
              placeholder="البحث في المركبات..."
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="الحالة"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="">الكل</MenuItem>
              <MenuItem value="ACTIVE">نشط</MenuItem>
              <MenuItem value="MAINTENANCE">صيانة</MenuItem>
              <MenuItem value="INACTIVE">غير نشط</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>
      {isLoading ? <Loading /> : selectedVehicle && (
        <MaintenanceFormDialog
          open={maintenanceFormOpen}
          onClose={() => setMaintenanceFormOpen(false)}
          onSubmit={handleMaintenanceSubmit}
          vehicle={selectedVehicle}
        loading={formLoading}
      />
      )}
      {isLoading ? (
        <Loading />
      ) : data && (
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
        additionalActions={[
          {
            icon: <IconReportMoney />,
            label: 'إضافة مصروف',
            onClick: handleAddExpense,
          },
          
            {
              icon: <IconTool />,
              label: 'إضافة صيانة',
              onClick: handleAddMaintenance,
            },
          ]}
      />
      )}

      {!isLoading && data && (
        <VehicleDialog
          open={vehicleDialogOpen}
          onClose={() => setVehicleDialogOpen(false)}
          vehicle={selectedVehicle}
          onSuccess={refetchVehicles}
        />
      )}

      {!isLoading && data && (
        <ExpenseDialog
          open={expenseDialogOpen}
          onClose={() => setExpenseDialogOpen(false)}
          vehicle={selectedVehicle}
          onSuccess={refetchVehicles}
        />
      )}
    </div>
  );
}
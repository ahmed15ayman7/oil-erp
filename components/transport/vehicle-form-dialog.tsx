'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  FormControlLabel,
  Switch,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useApi } from '@/hooks/use-api';

interface VehicleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export function VehicleFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: VehicleFormDialogProps) {
  const api = useApi();
  const [formData, setFormData] = useState({
    plateNumber: '',
    model: '',
    type: 'TRUCK',
    capacity: 0,
    driverId: '',
    status: 'ACTIVE',
    purchaseDate: null as Date | null,
    registrationExpiryDate: null as Date | null,
    insuranceExpiryDate: null as Date | null,
    fuelType: 'DIESEL',
    fuelCapacity: 0,
    notes: '',
    isActive: true,
  });

  // Fetch drivers
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.get('/api/drivers'),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        purchaseDate: initialData.purchaseDate ? new Date(initialData.purchaseDate) : null,
        registrationExpiryDate: initialData.registrationExpiryDate ? new Date(initialData.registrationExpiryDate) : null,
        insuranceExpiryDate: initialData.insuranceExpiryDate ? new Date(initialData.insuranceExpiryDate) : null,
      });
    } else {
      setFormData({
        plateNumber: '',
        model: '',
        type: 'TRUCK',
        capacity: 0,
        driverId: '',
        status: 'ACTIVE',
        purchaseDate: null,
        registrationExpiryDate: null,
        insuranceExpiryDate: null,
        fuelType: 'DIESEL',
        fuelCapacity: 0,
        notes: '',
        isActive: true,
      });
    }
  }, [initialData]);

  const handleChange = (field: string) => (event: any) => {
    const value = 
      event?.target?.type === 'checkbox'
        ? event.target.checked
        : event?.target?.type === 'number'
        ? parseFloat(event.target.value)
        : event?.target?.value ?? event;

    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      dir="rtl"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? 'تعديل مركبة' : 'إضافة مركبة جديدة'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم اللوحة"
                value={formData.plateNumber}
                onChange={handleChange('plateNumber')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الموديل"
                value={formData.model}
                onChange={handleChange('model')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="النوع"
                value={formData.type}
                onChange={handleChange('type')}
                required
              >
                <MenuItem value="TRUCK">شاحنة</MenuItem>
                <MenuItem value="VAN">فان</MenuItem>
                <MenuItem value="PICKUP">بيك أب</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="السعة (طن)"
                value={formData.capacity}
                onChange={handleChange('capacity')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={drivers?.drivers || []}
                getOptionLabel={(option) => option.name}
                value={
                  drivers?.drivers.find(
                    (d: { id: string }) => d.id === formData.driverId
                  ) || null
                }
                onChange={(_, newValue) =>
                  handleChange('driverId')(newValue?.id || '')
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="السائق"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="الحالة"
                value={formData.status}
                onChange={handleChange('status')}
                required
              >
                <MenuItem value="ACTIVE">نشط</MenuItem>
                <MenuItem value="MAINTENANCE">صيانة</MenuItem>
                <MenuItem value="INACTIVE">غير نشط</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="تاريخ الشراء"
                value={formData.purchaseDate}
                onChange={handleChange('purchaseDate')}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="تاريخ انتهاء الترخيص"
                value={formData.registrationExpiryDate}
                onChange={handleChange('registrationExpiryDate')}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="تاريخ انتهاء التأمين"
                value={formData.insuranceExpiryDate}
                onChange={handleChange('insuranceExpiryDate')}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="نوع الوقود"
                value={formData.fuelType}
                onChange={handleChange('fuelType')}
                required
              >
                <MenuItem value="DIESEL">ديزل</MenuItem>
                <MenuItem value="GASOLINE">بنزين</MenuItem>
                <MenuItem value="NATURAL_GAS">غاز طبيعي</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="سعة خزان الوقود (لتر)"
                value={formData.fuelCapacity}
                onChange={handleChange('fuelCapacity')}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleChange('isActive')}
                  />
                }
                label="نشط"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                value={formData.notes}
                onChange={handleChange('notes')}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            endIcon={
              loading ? <CircularProgress size={20} /> : null
            }
          >
            {initialData ? 'تعديل' : 'إضافة'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

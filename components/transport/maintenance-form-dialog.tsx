'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface MaintenanceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  vehicle?: any;
  loading?: boolean;
}

export function MaintenanceFormDialog({
  open,
  onClose,
  onSubmit,
  vehicle,
  loading = false,
}: MaintenanceFormDialogProps) {
  const [formData, setFormData] = useState({
    date: new Date(),
    type: 'REGULAR',
    description: '',
    cost: 0,
    nextMaintenanceDate: null as Date | null,
    status: 'COMPLETED',
    notes: '',
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        date: new Date(),
        type: 'REGULAR',
        description: '',
        cost: 0,
        nextMaintenanceDate: null,
        status: 'COMPLETED',
        notes: '',
      });
    }
  }, [open]);

  const handleChange = (field: string) => (event: any) => {
    const value = 
      event?.target?.type === 'number'
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
          إضافة سجل صيانة
          {vehicle && ` - ${vehicle.plateNumber}`}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="تاريخ الصيانة"
                value={formData.date}
                onChange={handleChange('date')}
                slotProps={{
                  textField: { fullWidth: true, required: true },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="نوع الصيانة"
                value={formData.type}
                onChange={handleChange('type')}
                required
              >
                <MenuItem value="REGULAR">صيانة دورية</MenuItem>
                <MenuItem value="REPAIR">إصلاح عطل</MenuItem>
                <MenuItem value="INSPECTION">فحص</MenuItem>
                <MenuItem value="EMERGENCY">صيانة طارئة</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="وصف الصيانة"
                value={formData.description}
                onChange={handleChange('description')}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="التكلفة"
                value={formData.cost}
                onChange={handleChange('cost')}
                required
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
                <MenuItem value="COMPLETED">مكتملة</MenuItem>
                <MenuItem value="IN_PROGRESS">جاري العمل</MenuItem>
                <MenuItem value="PENDING">معلقة</MenuItem>
                <MenuItem value="CANCELLED">ملغاة</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="موعد الصيانة القادمة"
                value={formData.nextMaintenanceDate}
                onChange={handleChange('nextMaintenanceDate')}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                value={formData.notes}
                onChange={handleChange('notes')}
                multiline
                rows={2}
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
            إضافة
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

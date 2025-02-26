'use client';

import { useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  MenuItem,
} from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

interface VehicleDialogProps {
  open: boolean;
  onClose: () => void;
  vehicle: any;
  onSuccess: () => void;
}

export function VehicleDialog({
  open,
  onClose,
  vehicle,
  onSuccess,
}: VehicleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [plateNumber, setPlateNumber] = useState(vehicle?.plateNumber || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [capacity, setCapacity] = useState(vehicle?.capacity || '');
  const [status, setStatus] = useState(vehicle?.status || 'ACTIVE');
  const [notes, setNotes] = useState(vehicle?.notes || '');
  const api = useApi();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (vehicle) {
        await api.put('/api/vehicles', {
          id: vehicle.id,
          plateNumber,
          model,
          capacity: parseFloat(capacity),
          status,
          notes,
        }, {
          successMessage: 'تم تحديث المركبة بنجاح',
        });
      } else {
        await api.post('/api/vehicles', {
          plateNumber,
          model,
          capacity: parseFloat(capacity),
          status,
          notes,
        }, {
          successMessage: 'تم إضافة المركبة بنجاح',
        });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showToast({
        message: 'حدث خطأ أثناء حفظ المركبة',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPlateNumber('');
    setModel('');
    setCapacity('');
    setStatus('ACTIVE');
    setNotes('');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {vehicle ? 'تعديل مركبة' : 'إضافة مركبة'}
      </DialogTitle>
      <DialogContent>
        <Box 
          component="form" 
          onSubmit={handleSubmit}
          className="space-y-4 mt-4"
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم اللوحة"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الموديل"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="السعة"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="الحالة"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <MenuItem value="ACTIVE">نشط</MenuItem>
                <MenuItem value="MAINTENANCE">صيانة</MenuItem>
                <MenuItem value="INACTIVE">غير نشط</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => {
            onClose();
            resetForm();
          }}
          disabled={loading}
        >
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {vehicle ? 'تحديث' : 'إضافة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

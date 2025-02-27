import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
} from '@mui/material';

interface WarehouseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function WarehouseFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
}: WarehouseFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'RAW_MATERIALS',
    location: '',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? 'تعديل مخزن' : 'إضافة مخزن جديد'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="اسم المخزن"
                value={formData.name}
                onChange={handleChange('name')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="نوع المخزن"
                value={formData.type}
                onChange={handleChange('type')}
                required
              >
                <MenuItem value="RAW_MATERIALS">مواد خام</MenuItem>
                <MenuItem value="BOTTLES">زجاجات</MenuItem>
                <MenuItem value="CARTONS">كراتين</MenuItem>
                <MenuItem value="STICKER">ستيكر</MenuItem>
                <MenuItem value="FINISHED_PRODUCTS">منتجات نهائية</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="الموقع"
                value={formData.location}
                onChange={handleChange('location')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="الوصف"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="submit" variant="contained">
            حفظ
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 
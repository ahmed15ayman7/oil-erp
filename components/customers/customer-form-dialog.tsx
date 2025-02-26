'use client';

import { useEffect, useState } from 'react';
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
} from '@mui/material';

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export function CustomerFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: CustomerFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'INDIVIDUAL',
    taxNumber: '',
    commercialRegister: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        type: 'INDIVIDUAL',
        taxNumber: '',
        commercialRegister: '',
        notes: '',
      });
    }
  }, [initialData]);

  const handleChange = (field: string) => (event: any) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
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
          {initialData ? 'تعديل عميل' : 'إضافة عميل جديد'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الاسم"
                value={formData.name}
                onChange={handleChange('name')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الهاتف"
                value={formData.phone}
                onChange={handleChange('phone')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
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
                <MenuItem value="INDIVIDUAL">فرد</MenuItem>
                <MenuItem value="COMPANY">شركة</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="العنوان"
                value={formData.address}
                onChange={handleChange('address')}
                multiline
                rows={2}
              />
            </Grid>
            {formData.type === 'COMPANY' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="الرقم الضريبي"
                    value={formData.taxNumber}
                    onChange={handleChange('taxNumber')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="السجل التجاري"
                    value={formData.commercialRegister}
                    onChange={handleChange('commercialRegister')}
                  />
                </Grid>
              </>
            )}
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

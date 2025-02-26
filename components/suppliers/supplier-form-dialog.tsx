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
  FormControlLabel,
  Switch,
} from '@mui/material';

interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export function SupplierFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: SupplierFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'LOCAL',
    taxNumber: '',
    commercialRegister: '',
    bankName: '',
    bankAccount: '',
    swift: '',
    iban: '',
    creditLimit: 0,
    creditPeriod: 30,
    isActive: true,
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
        type: 'LOCAL',
        taxNumber: '',
        commercialRegister: '',
        bankName: '',
        bankAccount: '',
        swift: '',
        iban: '',
        creditLimit: 0,
        creditPeriod: 30,
        isActive: true,
        notes: '',
      });
    }
  }, [initialData]);

  const handleChange = (field: string) => (event: any) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
    
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
          {initialData ? 'تعديل مورد' : 'إضافة مورد جديد'}
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
                <MenuItem value="LOCAL">محلي</MenuItem>
                <MenuItem value="INTERNATIONAL">دولي</MenuItem>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="اسم البنك"
                value={formData.bankName}
                onChange={handleChange('bankName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الحساب"
                value={formData.bankAccount}
                onChange={handleChange('bankAccount')}
              />
            </Grid>
            {formData.type === 'INTERNATIONAL' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="SWIFT"
                    value={formData.swift}
                    onChange={handleChange('swift')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="IBAN"
                    value={formData.iban}
                    onChange={handleChange('iban')}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="حد الائتمان"
                value={formData.creditLimit}
                onChange={handleChange('creditLimit')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="فترة الائتمان (بالأيام)"
                value={formData.creditPeriod}
                onChange={handleChange('creditPeriod')}
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

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
  Grid,
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useApi } from '@/hooks/use-api';

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export function ProductFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: ProductFormDialogProps) {
  const api = useApi();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    unitId: '',
    price: 0,
    quantity: 0,
    minQuantity: 0,
    maxQuantity: 0,
    barcode: '',
    isActive: true,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories'),
  });

  // Fetch units
  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get('/api/units'),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        name: initialData.name,
        description: initialData.description || '',
        categoryId: initialData.categoryId,
        unitId: initialData.unitId,
        price: initialData.price,
        quantity: initialData.quantity,
        minQuantity: initialData.minQuantity,
        maxQuantity: initialData.maxQuantity,
        barcode: initialData.barcode || '',
        isActive: initialData.isActive,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        categoryId: '',
        unitId: '',
        price: 0,
        quantity: 0,
        minQuantity: 0,
        maxQuantity: 0,
        barcode: '',
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
        : event?.target?.value;

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
          {initialData ? 'تعديل منتج' : 'إضافة منتج جديد'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الكود"
                value={formData.code}
                onChange={handleChange('code')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الباركود"
                value={formData.barcode}
                onChange={handleChange('barcode')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="اسم المنتج"
                value={formData.name}
                onChange={handleChange('name')}
                required
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
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="الفئة"
                value={formData.categoryId}
                onChange={handleChange('categoryId')}
                required
              >
                {categoriesData?.categories.map((category: any) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="الوحدة"
                value={formData.unitId}
                onChange={handleChange('unitId')}
                required
              >
                {unitsData?.units.map((unit: any) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="السعر"
                value={formData.price}
                onChange={handleChange('price')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="الكمية"
                value={formData.quantity}
                onChange={handleChange('quantity')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="الحد الأدنى للكمية"
                value={formData.minQuantity}
                onChange={handleChange('minQuantity')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="الحد الأقصى للكمية"
                value={formData.maxQuantity}
                onChange={handleChange('maxQuantity')}
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

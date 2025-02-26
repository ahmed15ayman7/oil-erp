'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import { ProductType } from '@prisma/client';
import { useEffect, useState } from 'react';

interface ProductFormData {
  name: string;
  sku: string;
  type: ProductType;
  quantity: number;
  unit: string;
  price: number;
  description?: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
  loading?: boolean;
}

const productTypes = [
  { value: 'RAW_MATERIAL', label: 'مواد خام' },
  { value: 'FINISHED_PRODUCT', label: 'منتج نهائي' },
  { value: 'PACKAGING', label: 'تغليف' },
  { value: 'BOTTLE', label: 'زجاجات' },
  { value: 'CARTON', label: 'كراتين' },
];

const units = ['لتر', 'كيلو', 'قطعة', 'كرتونة'];

export function ProductFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    type: 'FINISHED_PRODUCT',
    quantity: 0,
    unit: 'قطعة',
    price: 0,
    description: '',
    ...initialData,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  const handleChange = (field: keyof ProductFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === 'quantity' || field === 'price'
          ? parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? 'تعديل منتج' : 'إضافة منتج جديد'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <TextField
              fullWidth
              label="اسم المنتج"
              value={formData.name}
              onChange={handleChange('name')}
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="رمز المنتج"
              value={formData.sku}
              onChange={handleChange('sku')}
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              select
              label="نوع المنتج"
              value={formData.type}
              onChange={handleChange('type')}
              required
              disabled={loading}
            >
              {productTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="الكمية"
              value={formData.quantity}
              onChange={handleChange('quantity')}
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              select
              label="الوحدة"
              value={formData.unit}
              onChange={handleChange('unit')}
              required
              disabled={loading}
            >
              {units.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="السعر"
              value={formData.price}
              onChange={handleChange('price')}
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="الوصف"
              value={formData.description}
              onChange={handleChange('description')}
              disabled={loading}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

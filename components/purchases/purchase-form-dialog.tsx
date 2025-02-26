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
  IconButton,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { useApi } from '@/hooks/use-api';

interface PurchaseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export function PurchaseFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: PurchaseFormDialogProps) {
  const api = useApi();
  const [formData, setFormData] = useState({
    supplierId: '',
    invoiceNumber: '',
    date: new Date(),
    dueDate: null as Date | null,
    items: [
      {
        productId: '',
        quantity: 1,
        price: 0,
        total: 0,
      },
    ],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: '',
    paymentStatus: 'UNPAID',
    deliveryStatus: 'PENDING',
    attachments: [] as string[],
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/api/suppliers'),
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/api/products'),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: new Date(initialData.date),
        dueDate: initialData.dueDate ? new Date(initialData.dueDate) : null,
      });
    } else {
      setFormData({
        supplierId: '',
        invoiceNumber: '',
        date: new Date(),
        dueDate: null,
        items: [
          {
            productId: '',
            quantity: 1,
            price: 0,
            total: 0,
          },
        ],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        notes: '',
        paymentStatus: 'UNPAID',
        deliveryStatus: 'PENDING',
        attachments: [],
      });
    }
  }, [initialData]);

  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const total =
      subtotal + (subtotal * formData.tax) / 100 - formData.discount;
    return { subtotal, total };
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = {
      ...items[index],
      [field]: value,
    };

    // Update price if product changes
    if (field === 'productId') {
      const product = products?.products.find(
        (p: { id: string }) => p.id === value
      );
      if (product) {
        items[index].price = product.price;
      }
    }

    // Calculate item total
    items[index].total = items[index].quantity * items[index].price;

    // Calculate invoice totals
    const { subtotal, total } = calculateTotals(items);

    setFormData({
      ...formData,
      items,
      subtotal,
      total,
    });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: '',
          quantity: 1,
          price: 0,
          total: 0,
        },
      ],
    });
  };

  const handleRemoveItem = (index: number) => {
    const items = formData.items.filter((_, i) => i !== index);
    const { subtotal, total } = calculateTotals(items);
    setFormData({
      ...formData,
      items,
      subtotal,
      total,
    });
  };

  const handleChange = (field: string) => (event: any) => {
    const value =
      event?.target?.type === 'number'
        ? parseFloat(event.target.value)
        : event?.target?.value ?? event;

    if (field === 'tax' || field === 'discount') {
      const { subtotal, total } = calculateTotals(formData.items);
      setFormData({
        ...formData,
        [field]: value,
        subtotal,
        total,
      });
    } else {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      dir="rtl"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? 'تعديل فاتورة مشتريات' : 'إضافة فاتورة مشتريات جديدة'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={suppliers?.suppliers || []}
                getOptionLabel={(option) => option.name}
                value={
                  suppliers?.suppliers.find(
                    (s: { id: string }) => s.id === formData.supplierId
                  ) || null
                }
                onChange={(_, newValue) =>
                  handleChange('supplierId')(newValue?.id || '')
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="المورد"
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الفاتورة"
                value={formData.invoiceNumber}
                onChange={handleChange('invoiceNumber')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="تاريخ الفاتورة"
                value={formData.date}
                onChange={handleChange('date')}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="تاريخ الاستحقاق"
                value={formData.dueDate}
                onChange={handleChange('dueDate')}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>

            {/* Items */}
            <Grid item xs={12}>
              {formData.items.map((item, index) => (
                <Grid
                  container
                  spacing={2}
                  key={index}
                  className="mb-4"
                >
                  <Grid item xs={12} sm={4}>
                    <Autocomplete
                      fullWidth
                      options={products?.products || []}
                      getOptionLabel={(option) => option.name}
                      value={
                        products?.products.find(
                          (p: { id: string }) => p.id === item.productId
                        ) || null
                      }
                      onChange={(_, newValue) =>
                        handleItemChange(
                          index,
                          'productId',
                          newValue?.id || ''
                        )
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="المنتج"
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الكمية"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'quantity',
                          parseFloat(e.target.value)
                        )
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="السعر"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'price',
                          parseFloat(e.target.value)
                        )
                      }
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            جم
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <IconTrash />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button
                startIcon={<IconPlus />}
                onClick={handleAddItem}
                className="mt-2"
              >
                إضافة منتج
              </Button>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="الضريبة (%)"
                value={formData.tax}
                onChange={handleChange('tax')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">%</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="الخصم"
                value={formData.discount}
                onChange={handleChange('discount')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">جم</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="الإجمالي"
                value={formData.total}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">جم</InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="حالة الدفع"
                value={formData.paymentStatus}
                onChange={handleChange('paymentStatus')}
                required
              >
                <MenuItem value="PAID">مدفوع</MenuItem>
                <MenuItem value="PARTIALLY_PAID">
                  مدفوع جزئياً
                </MenuItem>
                <MenuItem value="UNPAID">غير مدفوع</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="حالة التوريد"
                value={formData.deliveryStatus}
                onChange={handleChange('deliveryStatus')}
                required
              >
                <MenuItem value="DELIVERED">تم التوريد</MenuItem>
                <MenuItem value="PARTIALLY_DELIVERED">
                  توريد جزئي
                </MenuItem>
                <MenuItem value="PENDING">قيد الانتظار</MenuItem>
              </TextField>
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

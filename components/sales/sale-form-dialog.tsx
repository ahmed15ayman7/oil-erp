'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Autocomplete,
} from '@mui/material';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';

interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  total: number;
}

interface SaleFormData {
  customerId: string;
  items: SaleItem[];
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

interface SaleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SaleFormData) => void;
  initialData?: Partial<SaleFormData>;
  loading?: boolean;
}

export function SaleFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: SaleFormDialogProps) {
  const api = useApi();
  const [formData, setFormData] = useState<SaleFormData>({
    customerId: '',
    items: [],
    total: 0,
    status: 'PENDING',
    ...initialData,
  });

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/api/customers'),
    enabled: open,
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/api/inventory'),
    enabled: open,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: '', quantity: 1, price: 0, total: 0 },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    calculateTotal();
  };

  const handleItemChange = (
    index: number,
    field: keyof SaleItem,
    value: any
  ) => {
    setFormData((prev) => {
      const items = [...prev.items];
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
      items[index].total =
        items[index].quantity * items[index].price;

      return { ...prev, items };
    });
    calculateTotal();
  };

  const calculateTotal = () => {
    setFormData((prev) => ({
      ...prev,
      total: prev.items.reduce((sum, item) => sum + item.total, 0),
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
      maxWidth="md"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? 'تعديل فاتورة' : 'فاتورة جديدة'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <Autocomplete
              options={customers?.customers || []}
              getOptionLabel={(option) => option.name}
              value={
                customers?.customers.find(
                  (c: { id: string }) => c.id === formData.customerId
                ) || null
              }
              onChange={(_, newValue) =>
                setFormData((prev) => ({
                  ...prev,
                  customerId: newValue?.id || '',
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="العميل"
                  required
                  disabled={loading}
                />
              )}
            />

            <Box className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">المنتجات</h3>
              <Button
                startIcon={<IconPlus />}
                onClick={handleAddItem}
                disabled={loading}
              >
                إضافة منتج
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>المنتج</TableCell>
                    <TableCell>الكمية</TableCell>
                    <TableCell>السعر</TableCell>
                    <TableCell>الإجمالي</TableCell>
                    <TableCell>حذف</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
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
                              required
                              disabled={loading}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'quantity',
                              parseInt(e.target.value) || 0
                            )
                          }
                          required
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          required
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        {item.total.toLocaleString('ar-EG', {
                          style: 'currency',
                          currency: 'EGP',
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                          disabled={loading}
                        >
                          <IconTrash />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box className="flex justify-end">
              <TextField
                label="الإجمالي"
                value={formData.total.toLocaleString('ar-EG', {
                  style: 'currency',
                  currency: 'EGP',
                })}
                disabled
              />
            </Box>

            <TextField
              select
              label="الحالة"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as any,
                }))
              }
              required
              disabled={loading}
              fullWidth
            >
              <MenuItem value="PENDING">معلقة</MenuItem>
              <MenuItem value="COMPLETED">مكتملة</MenuItem>
              <MenuItem value="CANCELLED">ملغاة</MenuItem>
            </TextField>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || formData.items.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
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
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
interface StockMovementDialogProps {
  open: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

export function StockMovementDialog({
  open,
  onClose,
  product,
  onSuccess,
}: StockMovementDialogProps) {
  const [type, setType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const api = useApi();
  const toast = useToast();

  // Fetch movements
  const { data: movementsData, refetch: refetchMovements } = useQuery({
    queryKey: ['movements', product?.id, startDate, endDate],
    queryFn: () =>
      api.get(
        `/api/stock-movements?productId=${product?.id}&startDate=${startDate?.toISOString()}&endDate=${endDate?.toISOString()}`
      ),
    enabled: !!product?.id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/api/stock-movements', {
        productId: product.id,
        type,
        quantity: parseFloat(quantity),
        reference,
        notes,
      });

      toast.showToast({ message: 'تم تسجيل حركة المخزون بنجاح', type: 'success' });
      setType('');
      setQuantity('');
      setReference('');
      setNotes('');
      refetchMovements();
      onSuccess();
    } catch (error) {
      console.error('Error creating stock movement:', error);
      toast.showToast({ message: 'حدث خطأ أثناء تسجيل حركة المخزون', type: 'error' });
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        حركة المخزون - {product.name}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} className="space-y-6">
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="نوع الحركة"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <MenuItem value="PURCHASE">شراء</MenuItem>
                <MenuItem value="SALE">بيع</MenuItem>
                <MenuItem value="RETURN">مرتجع</MenuItem>
                <MenuItem value="DAMAGE">تالف</MenuItem>
                <MenuItem value="ADJUSTMENT">تسوية</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الكمية"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="المرجع"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ملاحظات"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            تسجيل الحركة
          </Button>
        </Box>

        <Box className="mt-6">
          <Typography variant="h6" className="mb-4">
            سجل الحركات
          </Typography>

          <Grid container spacing={2} className="mb-4">
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="من تاريخ"
                value={startDate ? dayjs(startDate) : null}
                onChange={(value) => setStartDate(value ? value.toDate() : null)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="إلى تاريخ"
                value={endDate ? dayjs(endDate) : null}
                onChange={(value) => setEndDate(value ? value.toDate() : null)}
              />
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>نوع الحركة</TableCell>
                  <TableCell>الكمية</TableCell>
                  <TableCell>المرجع</TableCell>
                  <TableCell>المستخدم</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movementsData?.movements.map((movement: any) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.createdAt).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      {movement.type === 'PURCHASE' && 'شراء'}
                      {movement.type === 'SALE' && 'بيع'}
                      {movement.type === 'RETURN' && 'مرتجع'}
                      {movement.type === 'DAMAGE' && 'تالف'}
                      {movement.type === 'ADJUSTMENT' && 'تسوية'}
                    </TableCell>
                    <TableCell>
                      {movement.quantity.toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell>{movement.reference}</TableCell>
                    <TableCell>{movement.user.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
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

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  vehicle: any;
  onSuccess: () => void;
}

export function ExpenseDialog({
  open,
  onClose,
  vehicle,
  onSuccess,
}: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs().subtract(1, 'month'));
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const api = useApi();
  const { showToast } = useToast();

  // Fetch expenses
  const { data: expensesData, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', vehicle?.id, startDate, endDate],
    queryFn: () =>
      api.get(
        `/api/vehicle-expenses?vehicleId=${vehicle?.id}&startDate=${startDate?.toDate().toISOString()}&endDate=${endDate?.toDate().toISOString()}`
      ),
    enabled: !!vehicle?.id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/vehicle-expenses', {
        vehicleId: vehicle.id,
        type,
        amount: parseFloat(amount),
        date: date?.toISOString(),
        odometer: odometer ? parseFloat(odometer) : null,
        notes,
      }, {
        successMessage: 'تم إضافة المصروف بنجاح',
      });

      onSuccess();
      refetchExpenses();
      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast({
        message: 'حدث خطأ أثناء حفظ المصروف',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('');
    setAmount('');
    setDate(dayjs());
    setOdometer('');
    setNotes('');
  };

  if (!vehicle) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        إضافة مصروف - {vehicle.plateNumber}
      </DialogTitle>
      <DialogContent>
        <Box 
          component="form" 
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="نوع المصروف"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <MenuItem value="FUEL">وقود</MenuItem>
                <MenuItem value="MAINTENANCE">صيانة</MenuItem>
                <MenuItem value="OIL_CHANGE">تغيير زيت</MenuItem>
                <MenuItem value="TIRES">إطارات</MenuItem>
                <MenuItem value="INSURANCE">تأمين</MenuItem>
                <MenuItem value="OTHER">أخرى</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="المبلغ"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="التاريخ"
                value={date}
                onChange={(e) => setDate(e)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="قراءة العداد"
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
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
            fullWidth
            disabled={loading}
          >
            إضافة المصروف
          </Button>
        </Box>

        <Box className="mt-6">
          <Typography variant="h6" className="mb-4">
            سجل المصاريف
          </Typography>

          <Grid container spacing={2} className="mb-4">
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="من تاريخ"
                value={startDate}
                onChange={setStartDate}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="إلى تاريخ"
                value={endDate}
                onChange={setEndDate}
              />
            </Grid>
          </Grid>

          {expensesData?.totals && (
            <Box className="mb-4">
              <Typography variant="subtitle1" className="mb-2">
                إجمالي المصاريف حسب النوع:
              </Typography>
              <Grid container spacing={2}>
                {expensesData.totals.map((total: any) => (
                  <Grid item xs={6} sm={4} key={total.type}>
                    <Paper className="p-3 text-center">
                      <Typography variant="body2" color="textSecondary">
                        {total.type === 'FUEL' && 'وقود'}
                        {total.type === 'MAINTENANCE' && 'صيانة'}
                        {total.type === 'OIL_CHANGE' && 'تغيير زيت'}
                        {total.type === 'TIRES' && 'إطارات'}
                        {total.type === 'INSURANCE' && 'تأمين'}
                        {total.type === 'OTHER' && 'أخرى'}
                      </Typography>
                      <Typography variant="h6">
                        {total._sum.amount.toLocaleString('ar-EG')} جنيه
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>نوع المصروف</TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>قراءة العداد</TableCell>
                  <TableCell>المستخدم</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expensesData?.expenses.map((expense: any) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      {expense.type === 'FUEL' && 'وقود'}
                      {expense.type === 'MAINTENANCE' && 'صيانة'}
                      {expense.type === 'OIL_CHANGE' && 'تغيير زيت'}
                      {expense.type === 'TIRES' && 'إطارات'}
                      {expense.type === 'INSURANCE' && 'تأمين'}
                      {expense.type === 'OTHER' && 'أخرى'}
                    </TableCell>
                    <TableCell>
                      {expense.amount.toLocaleString('ar-EG')} جنيه
                    </TableCell>
                    <TableCell>
                      {expense.odometer?.toLocaleString('ar-EG') || '-'}
                    </TableCell>
                    <TableCell>{expense.user.name}</TableCell>
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

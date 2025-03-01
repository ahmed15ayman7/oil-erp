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

interface MaterialFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function MaterialFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
}: MaterialFormDialogProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'RAW_MATERIAL',
    unit: 'KG',
    quantity: 0,
    minQuantity: 0,
    price: 0,
    location: '',
    supplier: '',
    notes: '',
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? 'تعديل مادة' : 'إضافة مادة جديدة'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الكود"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="اسم المادة"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="النوع"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <MenuItem value="RAW_MATERIAL">مواد خام</MenuItem>
                <MenuItem value="PACKAGING">مواد تعبئة</MenuItem>
                <MenuItem value="BOTTLE">زجاجات</MenuItem>
                <MenuItem value="CARTON">كراتين</MenuItem>
                <MenuItem value="BOTTLE_CAP">غطاء الزجاجة</MenuItem>
                <MenuItem value="SLEEVE">سليف</MenuItem>
                <MenuItem value="TAPE">لزق</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="وحدة القياس"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              >
                <MenuItem value="KG">كيلوجرام</MenuItem>
                <MenuItem value="GRAM">جرام</MenuItem>
                <MenuItem value="LITER">لتر</MenuItem>
                <MenuItem value="PIECE">قطعة</MenuItem>
                <MenuItem value="BOX">صندوق</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="الكمية المتوفرة"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="الحد الأدنى"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="السعر"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="المورد"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="موقع التخزين"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
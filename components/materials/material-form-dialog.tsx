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
  Autocomplete,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';

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
  const api = useApi();
  const [formData, setFormData] = useState({
    code: `${Math.floor(Math.random() * 1000000)}`,
    name: '',
    type: 'RAW_MATERIAL',
    unit: 'KG',
    quantity: 0,
    minQuantity: 0,
    price: 0,
    warehouseId: '',
    notes: '',
  });
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/api/warehouses'),
  });
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }else{
      setFormData({
        code: `${Math.floor(Math.random() * 1000000)}`,
        name: '',
        type: 'RAW_MATERIAL',
        unit: 'KG',
        quantity: 0,
        minQuantity: 0,
        price: 0,
        warehouseId: '',
        notes: '',
      })
    }
  }, [initialData,open]);

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
                disabled
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
                <MenuItem value="TONNE">طن</MenuItem>
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
            <Autocomplete
                      fullWidth
                      options={warehouses?.warehouses || []}
                      getOptionLabel={(option) => option.name}
                      value={
                        warehouses?.warehouses.find(
                          (p: { id: string }) => p.id === formData.warehouseId
                        ) || null
                      }
                      onChange={(_, newValue) =>
                        setFormData({ ...formData, warehouseId: newValue?.id || '' })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="المخزن"
                          required
                        />
                      )}
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
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";

interface RepresentativeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export function RepresentativeFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: RepresentativeFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    area: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        phone: initialData.phone || "",
        area: initialData.area || "",
        status: initialData.status || "ACTIVE",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        area: "",
        status: "ACTIVE",
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (e: any) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? "تعديل بيانات المندوب" : "إضافة مندوب جديد"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <TextField
              fullWidth
              label="اسم المندوب"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="رقم الهاتف"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="المنطقة"
              name="area"
              value={formData.area}
              onChange={handleChange}
              required
            />
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={formData.status}
                label="الحالة"
                onChange={handleStatusChange}
              >
                <MenuItem value="ACTIVE">نشط</MenuItem>
                <MenuItem value="ON_LEAVE">في إجازة</MenuItem>
                <MenuItem value="INACTIVE">غير نشط</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>إلغاء</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {initialData ? "تحديث" : "إضافة"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 
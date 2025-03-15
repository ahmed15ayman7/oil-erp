"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

interface AssetFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export function AssetFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: AssetFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "MACHINE",
    value: "",
    purchaseDate: dayjs(),
    nextMaintenance: dayjs(),
    status: "ACTIVE",
    maxMaterials: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        type: initialData.type || "MACHINE",
        value: initialData.value?.toString() || "",
        purchaseDate: initialData.purchaseDate ? dayjs(initialData.purchaseDate) : dayjs(),
        nextMaintenance: dayjs(initialData.nextMaintenance) ,
        status: initialData.status || "ACTIVE",
        maxMaterials: initialData.maxMaterials || 0,
      });
    } else {
      setFormData({
        name: "",
        type: "MACHINE",
        value: "",
        purchaseDate: dayjs(),
        nextMaintenance: dayjs(),
        status: "ACTIVE",
        maxMaterials: 0,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      value: parseFloat(formData.value),
      purchaseDate: formData.purchaseDate.toISOString(),
      nextMaintenance: formData.nextMaintenance?.toISOString() || null,
      maxMaterials: formData.maxMaterials,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? "تعديل بيانات الأصل" : "إضافة أصل جديد"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <TextField
              fullWidth
              label="اسم الأصل"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <FormControl fullWidth required>
              <InputLabel>نوع الأصل</InputLabel>
              <Select
                name="type"
                value={formData.type}
                label="نوع الأصل"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <MenuItem value="MACHINE">ماكينة</MenuItem>
                <MenuItem value="EQUIPMENT">معدات</MenuItem>
                <MenuItem value="VEHICLE">مركبة</MenuItem>
                <MenuItem value="OTHER">أخرى</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="القيمة"
              name="value"
              type="number"
              value={formData.value}
              onChange={handleChange}
              required
            />

            <TextField
              fullWidth
              label="الحد الأقصى"
              name="maxMaterials"
              type="number"
              value={formData.maxMaterials}
              onChange={handleChange}
              required
            />

            <DatePicker
              label="تاريخ الشراء"
              value={formData.purchaseDate}
              onChange={(newValue) =>
                setFormData((prev) => ({
                  ...prev,
                  purchaseDate: newValue || dayjs(),
                }))
              }
              slotProps={{
                textField: { fullWidth: true },
              }}
            />

            <DatePicker
              label="موعد الصيانة القادمة"
              value={formData.nextMaintenance}
              onChange={(newValue) =>
                setFormData((prev) => ({
                  ...prev,
                  nextMaintenance: dayjs(newValue),
                }))
              }
              slotProps={{
                textField: { fullWidth: true },
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>الحالة</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="الحالة"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <MenuItem value="ACTIVE">نشط</MenuItem>
                <MenuItem value="MAINTENANCE">في الصيانة</MenuItem>
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

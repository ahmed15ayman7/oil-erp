"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { Unit } from "@prisma/client";

interface Units {
  units:Unit[],
  total: number,
  page: number,
  limit: number,
}

interface UnitsManagementProps {
  units: Units;
  onUpdate: () => void;
}

export function UnitsManagement({ units, onUpdate }: UnitsManagementProps) {
  const [open, setOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
  });

  const handleAdd = () => {
    setSelectedUnit(null);
    setFormData({ name: "", symbol: "", description: "" });
    setOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description || "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const loadingToast = toast.loading(
      selectedUnit ? "جاري تحديث الوحدة..." : "جاري إضافة الوحدة..."
    );
    try {
      if (selectedUnit) {
        await fetch("/api/units", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            id: selectedUnit.id,
          }),
        });
        toast.update(loadingToast, {
          render: "تم تحديث الوحدة بنجاح",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        await fetch("/api/units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        toast.update(loadingToast, {
          render: "تم إضافة الوحدة بنجاح",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      setOpen(false);
      onUpdate();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء حفظ البيانات",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const loadingToast = toast.loading("جاري حذف الوحدة...");
    try {
      await fetch(`/api/units?id=${id}`, {
        method: "DELETE",
      });
      toast.update(loadingToast, {
        render: "تم حذف الوحدة بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      onUpdate();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء حذف الوحدة",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error(error);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6">الوحدات</Typography>
            <Button variant="contained" onClick={handleAdd}>
              إضافة وحدة
            </Button>
          </div>
          <List>
            {units.units?.map((unit:Unit) => (
              <ListItem key={unit.id}>
                <ListItemText
                  primary={unit.name}
                  secondary={`${unit.symbol} - ${unit.description || ""}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(unit)}
                  >
                    <IconEdit size={18} />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(unit.id)}
                  >
                    <IconTrash size={18} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {selectedUnit ? "تعديل الوحدة" : "إضافة وحدة"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="اسم الوحدة"
            fullWidth
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <TextField
            margin="dense"
            label="الرمز"
            fullWidth
            value={formData.symbol}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, symbol: e.target.value }))
            }
          />
          <TextField
            margin="dense"
            label="الوصف"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} variant="contained">
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 
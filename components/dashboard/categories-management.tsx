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
interface category {
    id: string;
    name: string;
    description?: string;
    value?: number;
}
interface Category {
    categories: category[],
    total: number,
    page: number,
    limit: number,

}

interface CategoriesManagementProps {
  categories: Category;
  onUpdate: () => void;
}

export function CategoriesManagement({
  categories,
  onUpdate,
}: CategoriesManagementProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", value: 0 });

  const handleAdd = () => {
    setSelectedCategory(null);
    setFormData({ name: "", description: "", value: 0 });
    setOpen(true);
  };

  const handleEdit = (category: category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      value: category.value || 0,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const loadingToast = toast.loading(
      selectedCategory ? "جاري تحديث التصنيف..." : "جاري إضافة التصنيف..."
    );
    try {
      const response = await fetch("/api/categories", {
        method: selectedCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          selectedCategory
            ? { ...formData, id: selectedCategory.id }
            : formData
        ),
      });

      if (!response.ok) throw new Error();

      toast.update(loadingToast, {
        render: selectedCategory
          ? "تم تحديث التصنيف بنجاح"
          : "تم إضافة التصنيف بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      setOpen(false);
      onUpdate();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء حفظ البيانات",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleDelete = async (id: string) => {
    const loadingToast = toast.loading("جاري حذف التصنيف...");
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();

      toast.update(loadingToast, {
        render: "تم حذف التصنيف بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      onUpdate();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء حذف التصنيف",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6">التصنيفات</Typography>
            <Button variant="contained" onClick={handleAdd}>
              إضافة تصنيف
            </Button>
          </div>
          <List>
            {categories.categories?.map((category) => (
              <ListItem key={category.id}>
                <ListItemText
                  primary={category.name}
                  secondary={category.description}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(category)}
                  >
                    <IconEdit size={18} />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(category.id)}
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
          {selectedCategory ? "تعديل التصنيف" : "إضافة تصنيف"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="اسم التصنيف"
            fullWidth
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
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
          <TextField
            margin="dense"
            label=" القيمة (بالجرام)"
            fullWidth
            type="number"
            value={formData.value}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, value: parseInt(e.target.value) }))
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
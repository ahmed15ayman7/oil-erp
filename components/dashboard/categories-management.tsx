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
  Chip,
  Box,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconAlertTriangle,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingOverlay } from "../loading-overlay";

interface Category {
  id: string;
  name: string;
  description?: string;
  value?: number;
  createdAt?: Date;
  updatedAt?: Date;
  productsCount?: number;
}

interface Categories {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
}

interface CategoriesManagementProps {
  categories: Categories;
  onUpdate: () => void;
}

export function CategoriesManagement({
  categories,
  onUpdate,
}: CategoriesManagementProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    value: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setSelectedCategory(null);
    setFormData({ name: "", description: "", value: 0 });
    setError(null);
    setOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      value: category.value || 0,
    });
    setError(null);
    setOpen(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("اسم التصنيف مطلوب");
      return false;
    }
    if (formData.value < 0) {
      setError("القيمة يجب أن تكون أكبر من أو تساوي صفر");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "حدث خطأ أثناء حفظ البيانات");
      }

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
    } catch (error: any) {
      toast.update(loadingToast, {
        render: error.message || "حدث خطأ أثناء حفظ البيانات",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      setError(error.message || "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const loadingToast = toast.loading("جاري حذف التصنيف...");
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "حدث خطأ أثناء حذف التصنيف");
      }

      toast.update(loadingToast, {
        render: "تم حذف التصنيف بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      onUpdate();
    } catch (error: any) {
      toast.update(loadingToast, {
        render: error.message || "حدث خطأ أثناء حذف التصنيف",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <div>
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="flex items-center gap-2">
              التصنيفات
              <Chip
                label={`${categories.total} تصنيف`}
                size="small"
                color="primary"
              />
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={handleAdd}
            >
              إضافة تصنيف
            </Button>
          </div>
            <List>
              <AnimatePresence>
              {categories.categories?.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ListItem
                    className="rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <ListItemText
                      primary={
                        <div className="flex items-center gap-2">
                          {category.name}
                          {category.productsCount && category.productsCount > 0 && (
                            <Tooltip title="يحتوي على منتجات">
                              <Chip
                                label={`${category.productsCount} منتج`}
                                size="small"
                                color="info"
                              />
                            </Tooltip>
                          )}
                        </div>
                      }
                      secondary={
                        <div>
                          <Typography variant="body2" color="text.secondary">
                            {category.description || "لا يوجد وصف"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            القيمة: {category.value} جرام
                          </Typography>
                        </div>
                      }
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
                        disabled={!!category.productsCount}
                      >
                        <IconTrash size={18} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
            </List>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={() => !loading && setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCategory ? "تعديل التصنيف" : "إضافة تصنيف"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert
              severity="error"
              className="mb-4"
              icon={<IconAlertTriangle />}
            >
              {error}
            </Alert>
          )}
          <Box className="space-y-4 mt-4">
            <TextField
              autoFocus
              label="اسم التصنيف"
              fullWidth
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              error={!!error && !formData.name}
            />
            <TextField
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
              label="القيمة (بالجرام)"
              fullWidth
              type="number"
              value={formData.value}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  value: parseInt(e.target.value) || 0,
                }))
              }
              error={!!error && formData.value < 0}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            disabled={loading}
            color="inherit"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconCheck size={18} />
              )
            }
          >
            {loading ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
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
  IconRuler,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Unit } from "@prisma/client";

interface Units {
  units: Unit[];
  total: number;
  page: number;
  limit: number;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setSelectedUnit(null);
    setFormData({ name: "", symbol: "", description: "" });
    setError(null);
    setOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description || "",
    });
    setError(null);
    setOpen(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("اسم الوحدة مطلوب");
      return false;
    }
    if (!formData.symbol.trim()) {
      setError("رمز الوحدة مطلوب");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const loadingToast = toast.loading(
      selectedUnit ? "جاري تحديث الوحدة..." : "جاري إضافة الوحدة..."
    );

    try {
      const response = await fetch("/api/units", {
        method: selectedUnit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          selectedUnit ? { ...formData, id: selectedUnit.id } : formData
        ),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "حدث خطأ أثناء حفظ البيانات");
      }

      toast.update(loadingToast, {
        render: selectedUnit
          ? "تم تحديث الوحدة بنجاح"
          : "تم إضافة الوحدة بنجاح",
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
    const loadingToast = toast.loading("جاري حذف الوحدة...");
    try {
      const response = await fetch(`/api/units?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "حدث خطأ أثناء حذف الوحدة");
      }

      toast.update(loadingToast, {
        render: "تم حذف الوحدة بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      onUpdate();
    } catch (error: any) {
      toast.update(loadingToast, {
        render: error.message || "حدث خطأ أثناء حذف الوحدة",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <>
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="flex items-center gap-2">
              <IconRuler className="w-6 h-6" />
              الوحدات
              <Chip
                label={`${units.total} وحدة`}
                size="small"
                color="primary"
              />
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={handleAdd}
            >
              إضافة وحدة
            </Button>
          </div>

          <List>
            <AnimatePresence>
              {units.units?.map((unit) => (
                <motion.div
                  key={unit.id}
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
                          {unit.name}
                          <Tooltip title="رمز الوحدة">
                            <Chip
                              label={unit.symbol}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          </Tooltip>
                        </div>
                      }
                      secondary={unit.description || "لا يوجد وصف"}
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
          {selectedUnit ? "تعديل الوحدة" : "إضافة وحدة"}
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
              label="اسم الوحدة"
              fullWidth
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              error={!!error && !formData.name}
            />
            <TextField
              label="رمز الوحدة"
              fullWidth
              required
              value={formData.symbol}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, symbol: e.target.value }))
              }
              error={!!error && !formData.symbol}
              helperText="مثال: كجم، لتر، قطعة"
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
    </>
  );
} 
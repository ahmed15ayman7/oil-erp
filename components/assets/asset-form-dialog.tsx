"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";

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
  // تنفيذ نموذج إضافة/تعديل الأصول
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData ? "تعديل أصل" : "إضافة أصل جديد"}</DialogTitle>
      <DialogContent>{/* حقول النموذج */}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button onClick={() => onSubmit({})} disabled={loading}>
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

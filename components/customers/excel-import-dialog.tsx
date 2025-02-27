"use client";
const requiredColumns = [
  {
    id: "name",
    label: "الاسم",
    required: true,
  },
  {
    id: "phone",
    label: "رقم الهاتف",
    required: true,
  },
  {
    id: "address",
    label: "العنوان",
    required: false,
  },
  {
    id: "type",
    label: "النوع (جملة/قطاعي)",
    required: true,
  },
  {
    id: "taxNumber",
    label: "الرقم الضريبي",
    required: false,
  },
  {
    id: "commercialReg",
    label: "السجل التجاري",
    required: false,
  },
];

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { IconFileImport } from "@tabler/icons-react";
import { toast } from "react-toastify";
interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExcelImportDialog({
  open,
  onClose,
  onSuccess,
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    const loadingToast = toast.loading("جاري استيراد البيانات...");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/customers/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.update(loadingToast, {
          render: "فشل استيراد البيانات",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        throw new Error("فشل استيراد البيانات");
      }

      toast.update(loadingToast, {
        render: "تم استيراد البيانات بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء استيراد البيانات",
        type: "error",
        autoClose: 3000,
        isLoading: false,
      });
      console.error("Error importing customers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>استيراد بيانات العملاء</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            الأعمدة المطلوبة في ملف Excel:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              الاسم
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              رقم الهاتف
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              العنوان
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              النوع - قطاعي أو جملة
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              الرقم الضريبي - اختياري
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              السجل التجاري - اختياري
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: "center", py: 2 }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="excel-file"
          />
          <label htmlFor="excel-file">
            <Button
              component="span"
              variant="outlined"
              startIcon={<IconFileImport />}
            >
              اختر ملف Excel
            </Button>
          </label>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              تم اختيار: {file.name}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          onClick={handleSubmit}
          disabled={!file || loading}
          variant="contained"
        >
          استيراد
        </Button>
      </DialogActions>
    </Dialog>
  );
}

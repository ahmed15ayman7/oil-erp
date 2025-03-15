import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import { IconUpload } from "@tabler/icons-react";
import { toast } from "react-toastify";

const REQUIRED_COLUMNS = [
  { key: "name", label: "اسم المندوب" },
  { key: "phone", label: "رقم الهاتف" },
  { key: "area", label: "المنطقة" },
  { key: "status", label: "الحالة" },
];

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
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx")) {
        setError("يجب اختيار ملف Excel بصيغة .xlsx");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/representatives/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "حدث خطأ أثناء استيراد البيانات");
      }

      toast.success("تم استيراد البيانات بنجاح");
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message);
      toast.error("حدث خطأ أثناء استيراد البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>استيراد بيانات المندوبين</DialogTitle>
      <DialogContent>
        <div className="space-y-4">
          <Typography variant="subtitle1" gutterBottom>
            يجب أن يحتوي ملف Excel على الأعمدة التالية:
          </Typography>
          <ul className="list-disc list-inside space-y-1">
            {REQUIRED_COLUMNS.map((col) => (
              <li key={col.key}>{col.label}</li>
            ))}
          </ul>

          <Box
            sx={{
              border: "2px dashed",
              borderColor: "primary.main",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              mt: 2,
              cursor: "pointer",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
            component="label"
          >
            <input
              type="file"
              accept=".xlsx"
              hidden
              onChange={handleFileChange}
            />
            <IconUpload size={32} className="mx-auto mb-2" />
            <Typography>
              {file ? file.name : "اختر ملف Excel أو قم بسحبه هنا"}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" className="mt-4">
              {error}
            </Alert>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!file || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          استيراد
        </Button>
      </DialogActions>
    </Dialog>
  );
} 
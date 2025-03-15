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
import { toast } from "react-toastify";

const REQUIRED_COLUMNS = [
  "اسم الأصل",
  "النوع",
  "القيمة",
  "تاريخ الشراء",
  "موعد الصيانة القادمة",
  "الحالة",
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
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".xlsx")) {
      setError("يجب أن يكون الملف بصيغة .xlsx");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("الرجاء اختيار ملف");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/assets/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success(data.message);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error importing file:", error);
      setError(
        error instanceof Error ? error.message : "حدث خطأ أثناء استيراد الملف"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];

    if (!droppedFile.name.endsWith(".xlsx")) {
      setError("يجب أن يكون الملف بصيغة .xlsx");
      return;
    }

    setFile(droppedFile);
    setError(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>استيراد الأصول من Excel</DialogTitle>
      <DialogContent>
        <Box className="space-y-4">
          <Typography variant="body2" color="text.secondary">
            يجب أن يحتوي ملف Excel على الأعمدة التالية:
          </Typography>
          <Box
            sx={{
              backgroundColor: "grey.100",
              p: 2,
              borderRadius: 1,
              direction: "rtl",
            }}
          >
            <ul className="list-disc list-inside space-y-1">
              {REQUIRED_COLUMNS.map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </Box>

          <Box
            sx={{
              border: "2px dashed",
              borderColor: "grey.300",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              cursor: "pointer",
              "&:hover": {
                borderColor: "primary.main",
              },
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              type="file"
              id="file-input"
              accept=".xlsx"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <Typography>
              {file
                ? file.name
                : "اسحب ملف Excel هنا أو انقر لاختيار الملف"}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!file || loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          استيراد
        </Button>
      </DialogActions>
    </Dialog>
  );
} 
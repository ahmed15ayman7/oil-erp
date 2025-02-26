'use client';

import { useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { IconFileImport } from '@tabler/icons-react';
import { Workbook } from 'exceljs';

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
  const api = useApi();
  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      showToast({ message: 'الرجاء اختيار ملف', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = new Workbook();
          await workbook.xlsx.load(buffer);
          
          const worksheet = workbook.worksheets[0];
          const products: { code: string; quantity: number }[] = [];

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const code = row.getCell('الكود').text.toString();
              const quantity = parseFloat(row.getCell('الكمية الحالية').text) || 0;
              
              if (code) {
                products.push({ code, quantity });
              }
            }
          });

          await api.patch('/api/products/bulk-update', {
            body: JSON.stringify({ products }),
            successMessage: 'تم استيراد البيانات بنجاح',
            onSuccess: () => {
              onSuccess();
              onClose();
            },
          });
        } catch (error) {
          console.error('Error processing Excel file:', error);
          showToast({ 
            message: 'حدث خطأ أثناء معالجة الملف',
            type: 'error'
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing Excel file:', error);
      showToast({ 
        message: 'حدث خطأ أثناء استيراد الملف',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>استيراد بيانات المخزون</DialogTitle>
      <DialogContent>
        <Box className="space-y-4">
          <Typography>
            قم باختيار ملف Excel يحتوي على بيانات المخزون. يجب أن يحتوي الملف على الأعمدة التالية:
          </Typography>
          <ul className="list-disc list-inside space-y-2">
            <li>الكود: كود المنتج</li>
            <li>الكمية الحالية: الكمية المتوفرة حالياً</li>
          </ul>
          <Box className="mt-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file"
            />
            <label htmlFor="excel-file">
              <Button
                component="span"
                variant="outlined"
                startIcon={<IconFileImport />}
                disabled={loading}
              >
                اختيار ملف
              </Button>
            </label>
            {file && (
              <Typography variant="body2" className="mt-2">
                الملف المختار: {file.name}
              </Typography>
            )}
          </Box>
          {loading && <LinearProgress className="mt-4" />}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          إلغاء
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!file || loading}
        >
          استيراد
        </Button>
      </DialogActions>
    </Dialog>
  );
}

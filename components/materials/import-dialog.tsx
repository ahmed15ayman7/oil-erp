import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import { useApi } from '@/hooks/use-api';
import { IconFileImport } from '@tabler/icons-react';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportDialog({ open, onClose, onSuccess }: ImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const api = useApi();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
    let res=  await fetch('/api/materials/import', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(res.body);
      }
    } catch (error: any) {
      setError(error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>استيراد المواد من ملف Excel</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          يجب أن يحتوي الملف على الأعمدة التالية:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="اسم المادة (مطلوب)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="الكود (مطلوب وفريد)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="النوع (مواد خام، مواد تعبئة، زجاجات، كراتين)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="وحدة القياس (كيلوجرام، جرام، لتر، قطعة، صندوق)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="الكمية (رقم)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="الحد الأدنى (رقم)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="السعر (رقم)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="المورد (اختياري)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="موقع التخزين (اختياري)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="ملاحظات (اختياري)"
            />
          </ListItem>
        </List>
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
        {error && (
          <Alert severity="error" className="mt-4">
            <AlertTitle>خطأ في استيراد البيانات</AlertTitle>
            {error.message}
            {error.data?.validationErrors && (
              <List dense>
                {error.data.validationErrors.map((err: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={`صف ${err.row}: ${err.error}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            {error.data?.duplicateCodes && (
              <Typography variant="body2">
                الأكواد المكررة: {error.data.duplicateCodes.join(', ')}
              </Typography>
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          variant="contained"
          disabled={loading}
        >
          استيراد
        </Button>
      </DialogActions>
    </Dialog>
  );
}
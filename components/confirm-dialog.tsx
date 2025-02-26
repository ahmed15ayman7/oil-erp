'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => !loading && onCancel()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onCancel}
          disabled={loading}
          color="inherit"
        >
          إلغاء
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          color="error"
          variant="contained"
        >
          {loading ? 'جاري التنفيذ...' : 'تأكيد'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

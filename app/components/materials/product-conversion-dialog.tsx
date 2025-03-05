'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';

interface ProductConversionDialogProps {
  open: boolean;
  onClose: () => void;
  material: any;
  onSuccess: () => void;
}

export function ProductConversionDialog({
  open,
  onClose,
  material,
  onSuccess,
}: ProductConversionDialogProps) {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [conversionResult, setConversionResult] = useState<any>(null);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/api/products'),
  });

  const handleConvert = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/materials/convert', {
        materialId: material.id,
        productId: selectedProduct,
        quantity: quantity,
      });
      
      setConversionResult(response);
    } catch (error) {
      console.error('Error during conversion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await api.post('/api/materials/convert/confirm', {
        materialId: material.id,
        productId: selectedProduct,
        quantity: quantity,
        result: conversionResult,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error confirming conversion:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>تحويل المادة الخام إلى منتج</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              المادة الخام: {material?.name}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>المنتج</InputLabel>
              <Select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                {products && products?.products?.map((product: any) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="الكمية بالطن"
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                setConversionResult(null);
              }}
              InputProps={{
                inputProps: { min: 0, step: 0.05 }
              }}
            />
          </Grid>

          {conversionResult && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body1">نتيجة التحويل:</Typography>
                <Typography>عدد الزجاجات: {conversionResult.bottles}</Typography>
                <Typography>عدد الكراتين: {conversionResult.cartons}</Typography>
                <Typography>عدد الأغطية: {conversionResult.caps}</Typography>
                <Typography>عدد السليف: {conversionResult.sleeves}</Typography>
                <Typography>عدد الاستيكر: {conversionResult.stickers}</Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setConversionResult(null);
          setSelectedProduct('');
          setQuantity(0);
          onClose();
        }}>إلغاء</Button>
        {!conversionResult ? (
          <Button 
            onClick={handleConvert}
            variant="contained" 
            disabled={loading || !selectedProduct || quantity <= 0}
          >
            حساب التحويل
          </Button>
        ) : (
          <Button 
            onClick={handleConfirm}
            variant="contained" 
            color="success"
            disabled={loading}
          >
            تأكيد التحويل
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 
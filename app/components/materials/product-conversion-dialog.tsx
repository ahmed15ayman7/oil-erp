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
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

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
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [startTime, setStartTime] = useState<dayjs.Dayjs>(dayjs());
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/api/products'),
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.get('/api/assets?status=ACTIVE'),
  });

  const handleConvert = async () => {
    try {
      const maxMaterials = assets?.assets?.find((asset: any) => asset.id === selectedAsset)?.maxMaterials;
      if (maxMaterials && quantity > maxMaterials) {
        setError('الكمية المحددة أكبر من الحد الأقصى للمواد الخام المستخدمة');
        return;
      }
      setLoading(true);
      const response = await api.post('/api/materials/convert', {
        materialId: material.id,
        productId: selectedProduct,
        assetId: selectedAsset,
        quantity: quantity,
        startTime: startTime.toISOString(),
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
        assetId: selectedAsset,
        quantity: quantity,
        startTime: startTime.toISOString(),
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

  const handleClose = () => {
    setConversionResult(null);
    setSelectedProduct('');
    setSelectedAsset('');
    setQuantity(0);
    setStartTime(dayjs());
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
              <InputLabel>الأصل المستخدم</InputLabel>
              <Select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                required
              >
                {assets?.assets?.map((asset: any) => (
                  <MenuItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>المنتج</InputLabel>
              <Select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                required
              >
                {products?.products?.map((product: any) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="الكمية بالطن"
              type="number"
              value={quantity}
              error={!!error}
              helperText={error}
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                setConversionResult(null);
              }}
              InputProps={{
                inputProps: { min: 0, step: 0.05 }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="وقت بدء الإنتاج"
              value={startTime}
              onChange={(newValue) => setStartTime(newValue || dayjs())}
              slotProps={{
                textField: { fullWidth: true }
              }}
            />
          </Grid>

          {conversionResult && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body1">نتيجة التحويل:</Typography>
                <Typography color={conversionResult.avialableBottles ? 'default' : 'error'}>عدد الزجاجات: {conversionResult.bottles}</Typography>
                <Typography color={conversionResult.avialableCartons ? 'default' : 'error'}>عدد الكراتين: {conversionResult.cartons}</Typography>
                <Typography color={conversionResult.avialableCaps ? 'default' : 'error'}>عدد الأغطية: {conversionResult.caps}</Typography>
                <Typography color={conversionResult.avialableSleeves ? 'default' : 'error'}>عدد السليف: {conversionResult.sleeves}</Typography>
                <Typography color={conversionResult.avialableStickers ? 'default' : 'error'}>عدد الاستيكر: {conversionResult.stickers}</Typography>
              </Alert>
             { (!conversionResult.avialableBottles || !conversionResult.avialableCartons || !conversionResult.avialableCaps || !conversionResult.avialableSleeves || !conversionResult.avialableStickers) && <Alert severity={'error'}>
               يجب اضافة مواد لتكملة الإنتاج 
              </Alert>}
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>إلغاء</Button>
        {!conversionResult ? (
          <Button 
            onClick={handleConvert}
            variant="contained" 
            disabled={loading || !selectedProduct || !selectedAsset || quantity <= 0}
          >
            حساب التحويل
          </Button>
        ) : (
          <Button 
            onClick={handleConfirm}
            variant="contained" 
            color="success"
            disabled={loading || !conversionResult.avialableBottles || !conversionResult.avialableCartons || !conversionResult.avialableCaps || !conversionResult.avialableSleeves || !conversionResult.avialableStickers}
          >
            تأكيد التحويل
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 
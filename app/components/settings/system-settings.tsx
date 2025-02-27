"use client";

import { useState } from "react";
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useApi } from "@/hooks/use-api";
import { toast } from "react-toastify";

export function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    enableNotifications: true,
    lowStockThreshold: 10,
    autoBackup: true,
    backupFrequency: 7,
  });
  const api = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let toastId = toast.loading("جاري حفظ الإعدادات...");
    setLoading(true);
    try {
      await api.put("/api/settings/system", settings);
      toast.update(toastId, {
        render: "تم حفظ إعدادات النظام بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error(error);
      toast.update(toastId, {
        render: "حدث خطأ أثناء حفظ الإعدادات",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enableNotifications}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    enableNotifications: e.target.checked,
                  }))
                }
              />
            }
            label="تفعيل الإشعارات"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="حد المخزون المنخفض"
            value={settings.lowStockThreshold}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                lowStockThreshold: parseInt(e.target.value),
              }))
            }
          />
        </Grid>
        {/* ... المزيد من الإعدادات ... */}
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            حفظ الإعدادات
          </Button>
        </Grid>
      </Grid>
    </form>
  );
} 
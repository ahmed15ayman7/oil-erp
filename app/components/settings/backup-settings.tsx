"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import { useApi } from "@/hooks/use-api";
import { toast } from "react-toastify";
import { IconDownload, IconUpload } from "@tabler/icons-react";

export function BackupSettings() {
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleBackup = async () => {
    setLoading(true);
    let toastId = toast.loading("جاري إنشاء النسخة الاحتياطية...");
    try {
      const response = await api.post("/api/settings/backup", {}
      );
      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString()}.json`;
      a.click();
      toast.update(toastId, {
        render: "تم إنشاء النسخة الاحتياطية بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error(error);
      toast.update(toastId, {
        render: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              إنشاء نسخة احتياطية
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconDownload />}
              onClick={handleBackup}
              disabled={loading}
            >
              تحميل نسخة احتياطية
            </Button>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              استعادة نسخة احتياطية
            </Typography>
            <Button
              variant="outlined"
              startIcon={<IconUpload />}
              component="label"
              disabled={loading}
            >
              رفع نسخة احتياطية
              <input type="file" hidden accept=".json" />
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
} 
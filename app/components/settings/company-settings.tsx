"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useApi } from "@/hooks/use-api";
import { toast } from "react-toastify";

export function CompanySettings() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxNumber: "",
    commercialReg: "",
    logo: "",
  });
  const api = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let toastId = toast.loading("جاري حفظ الإعدادات...");
    setLoading(true);
    try {
      await api.put("/api/settings/company", formData);
      toast.update(toastId, {
        render: "تم حفظ إعدادات الشركة بنجاح",
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
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="اسم الشركة"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="العنوان"
            value={formData.address}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, address: e.target.value }))
            }
          />
        </Grid>
        {/* ... المزيد من الحقول ... */}
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            حفظ التغييرات
          </Button>
        </Grid>
      </Grid>
    </form>
  );
} 
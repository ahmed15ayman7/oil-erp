'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  MenuItem,
} from '@mui/material';
import { toast } from 'react-toastify';
import { useApi } from '@/hooks/use-api';

const roles = [
  { value: 'ADMIN', label: 'مدير' },
  { value: 'ACCOUNTANT', label: 'محاسب' },
  { value: 'REPRESENTATIVE', label: 'مندوب' },
  { value: 'WAREHOUSE_KEEPER', label: 'أمين مخزن' },
  { value: 'EMPLOYEE', label: 'موظف' },
];

export default function RegisterPage() {
  const router = useRouter();
  const api = useApi();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      role: formData.get('role') as string,
    };

    if (data.password !== data.confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/auth/register', data, {
        successMessage: 'تم إنشاء الحساب بنجاح',
      });
      router.push('/auth/login');
    } catch (error) {
      // Error is handled by useApi
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-background p-4">
      <Paper elevation={3} className="p-8 max-w-md w-full">
        <Typography
          component="h1"
          variant="h4"
          className="text-center mb-6 text-primary"
        >
          إنشاء حساب جديد
        </Typography>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="الاسم"
            name="name"
            autoComplete="name"
            autoFocus
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="البريد الإلكتروني"
            name="email"
            autoComplete="email"
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="كلمة المرور"
            type="password"
            id="password"
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="تأكيد كلمة المرور"
            type="password"
            id="confirmPassword"
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            select
            name="role"
            label="الدور الوظيفي"
            defaultValue="EMPLOYEE"
            disabled={loading}
          >
            {roles.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 mt-4"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </Button>
          <Box className="text-center mt-4">
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/90"
            >
              لديك حساب بالفعل؟ تسجيل الدخول
            </Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

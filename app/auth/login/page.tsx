"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TextField, Button, Paper, Typography, Box, Link } from "@mui/material";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("خطأ في البريد الإلكتروني أو كلمة المرور");
      } else {
        router.push("/dashboard");
        toast.success("تم تسجيل الدخول بنجاح");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الدخول");
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
          تسجيل الدخول
        </Typography>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="البريد الإلكتروني"
            name="email"
            autoComplete="email"
            autoFocus
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
            autoComplete="current-password"
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 mt-4"
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
          <div className="flex justify-center">
            <Link
              href="/auth/register"
              className="text-primary hover:text-primary/90"
            >
              انشاء حساب
            </Link>
          </div>
        </form>
      </Paper>
    </Box>
  );
}

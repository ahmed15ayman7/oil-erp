"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SearchInput } from "@/components/search-input";
import { Box, Chip, FormControl, InputLabel, Select, MenuItem, Grid, Container } from "@mui/material";
import { toast } from "react-toastify";
import { TransactionChart } from "@/components/treasury/transaction-chart";
import { StatsCards } from "@/components/treasury/stats-cards";
import dayjs from "dayjs";
import axios from "axios";

const columns = [
  {
    id: "date",
    label: "التاريخ",
    format: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm"),
  },
  {
    id: "type",
    label: "نوع العملية",
    format: (value: string) => {
      const typeMap = {
        SALE_PAYMENT: { label: "دفع مبيعات", color: "success" },
        PURCHASE_PAYMENT: { label: "دفع مشتريات", color: "error" },
        MAINTENANCE_COST: { label: "تكلفة صيانة", color: "warning" },
        VEHICLE_EXPENSE: { label: "مصاريف مركبات", color: "info" },
        DELIVERY_PAYMENT: { label: "مدفوعات توصيل", color: "primary" },
        SALARY: { label: "رواتب", color: "secondary" },
        OTHER: { label: "أخرى", color: "default" },
      };
      const type = typeMap[value as keyof typeof typeMap];
      return <Chip label={type.label} color={type.color as any} size="small" />;
    },
  },
  {
    id: "amount",
    label: "المبلغ",
    format: (value: number) =>
      value.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }),
  },
  {
    id: "reference",
    label: "رقم المرجع",
  },
  {
    id: "description",
    label: "الوصف",
  },
  {
    id: "status",
    label: "الحالة",
    format: (value: string) => {
      const statusMap = {
        COMPLETED: { label: "مكتمل", color: "success" },
        PENDING: { label: "معلق", color: "warning" },
        CANCELLED: { label: "ملغي", color: "error" },
      };
      const status = statusMap[value as keyof typeof statusMap];
      return <Chip label={status.label} color={status.color as any} size="small" />;
    },
  },
];

export default function TreasuryPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  const {
    data,
    isLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions", page, rowsPerPage, searchQuery, transactionType],
    queryFn: async () => {
      const response = await fetch(
        `/api/treasury?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}&type=${transactionType}`
      );
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء جلب البيانات");
      }
      return response.json();
    },
  });
  useEffect(() => {
    refetchTransactions();
  }, [searchQuery, page, rowsPerPage, transactionType]);
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["treasury-stats"],
    queryFn: async () => {
      const response = await axios.get("/api/treasury/stats");
      return response.data;
    },
  });

  const handleDelete = async (transaction: any) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    const loadingToast = toast.loading("جاري حذف العملية...");
    setFormLoading(true);
    try {
      const response = await fetch(`/api/treasury/${selectedTransaction.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء حذف العملية");
      }

      toast.update(loadingToast, {
        render: "تم حذف العملية بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      setDeleteDialogOpen(false);
      refetchTransactions();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء حذف العملية",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <PageHeader title="الخزينة" />

        {statsLoading ? Array(3).fill(0).map((e, i) => (
          <StatsCards key={i} isLoading={true} stats={{
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0,
            incomeChange: 0,
            expenseChange: 0,
          }} />
        )) : (
          stats && (
            <Box sx={{ mb: 4 }}>
              <StatsCards stats={stats} isLoading={false} />
            </Box>
          )
        )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TransactionChart
            title="المبيعات"
            type="SALE_PAYMENT"
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TransactionChart
            title="المشتريات"
            type="PURCHASE_PAYMENT"
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TransactionChart
            title="مصاريف الصيانة"
            type="MAINTENANCE_COST"
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TransactionChart
            title="مصاريف النقل"
            type="VEHICLE_EXPENSE"
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TransactionChart
            title="مدفوعات التوصيل"
            type="DELIVERY_PAYMENT"
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TransactionChart
            title="الرواتب"
            type="SALARY"
            color="#795548"
          />
        </Grid>
      </Grid>

        <Box sx={{ mt: 4 }}>
          <Box className="flex gap-4 mb-6">
            <SearchInput
              onSearch={setSearchQuery}
              placeholder="البحث في المعاملات..."
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>نوع العملية</InputLabel>
              <Select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                label="نوع العملية"
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="SALE_PAYMENT">دفع مبيعات</MenuItem>
                <MenuItem value="PURCHASE_PAYMENT">دفع مشتريات</MenuItem>
                <MenuItem value="MAINTENANCE_COST">تكلفة صيانة</MenuItem>
                <MenuItem value="VEHICLE_EXPENSE">مصاريف مركبات</MenuItem>
                <MenuItem value="DELIVERY_PAYMENT">مدفوعات توصيل</MenuItem>
                <MenuItem value="SALARY">رواتب</MenuItem>
                <MenuItem value="OTHER">أخرى</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {isLoading ? (
            <Loading />
          ) : (
            data && (
              <DataTable
                columns={columns}
                data={data?.transactions || []}
                loading={isLoading}
                page={page}
                totalCount={data?.total || 0}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                onDelete={handleDelete}
              />
            )
          )}
        </Box>
      </Box>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="حذف العملية"
        message="هل أنت متأكد من حذف هذه العملية؟ سيتم إلغاء جميع الإجراءات المرتبطة بها."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={formLoading}
      />
    </Container>
  );
}

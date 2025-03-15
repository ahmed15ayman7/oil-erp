"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { SearchInput } from "@/components/search-input";
import { Box, Chip, Button, Grid, Autocomplete, TextField } from "@mui/material";
import { ExcelImportDialog } from "@/components/customers/excel-import-dialog";
import {
  IconFileExport,
  IconFileImport,
  IconPrinter,
} from "@tabler/icons-react";
import { exportToExcel } from "@/lib/excel";
import { generateCustomerReport } from "@/lib/pdf";
import { toast } from "react-toastify";

const columns = [
  {
    id: "name",
    label: "الاسم",
  },
  {
    id: "phone",
    label: "رقم الهاتف",
  },
  {
    id: "address",
    label: "العنوان",
  },
  {
    id: "type",
    label: "النوع",
    format: (value: string) => {
      const typeMap = {
        WHOLESALE: { label: "قطاعي", color: "primary" },
        RETAIL: { label: "جملة", color: "secondary" },
      };
      const type = typeMap[value as keyof typeof typeMap];
      return <Chip label={type.label} color={type.color as any} size="small" />;
    },
  },
  {
    id: "balance",
    label: "الرصيد",
    format: (value: number) =>
      value.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }),
  },
];

export default function CustomersPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [type, setType] = useState("");
  let types = [{id:'WHOLESALE',name:'قطاعي'},{id:'RETAIL',name:'جملة'}]

  const {
    data,
    isLoading,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["customers", page, rowsPerPage, searchQuery, type],
    queryFn: () =>
      fetch(
        `/api/customers?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}&type=${type}`
      ).then((res) => res.json()),
  });

  useEffect(() => {
    refetchCustomers();
  }, [type,searchQuery,page,rowsPerPage]);

  const handleAdd = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleDelete = (customer: any) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    const loadingToast = toast.loading(
      selectedCustomer ? "جاري تحديث البيانات..." : "جاري إضافة العميل..."
    );
    setFormLoading(true);
    try {
      if (selectedCustomer) {
        await fetch("/api/customers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            id: selectedCustomer.id,
          }),
        });
        toast.update(loadingToast, {
          render: "تم تحديث بيانات العميل بنجاح",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        toast.update(loadingToast, {
          render: "تم إضافة العميل بنجاح",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      setFormOpen(false);
      refetchCustomers();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء حفظ البيانات",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    const loadingToast = toast.loading("جاري حذف العميل...");
    setFormLoading(true);
    try {
      await fetch(`/api/customers?id=${selectedCustomer.id}`, {
        method: "DELETE",
      });
      toast.update(loadingToast, {
        render: "تم حذف العميل بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      setDeleteDialogOpen(false);
      refetchCustomers();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء حذف العميل",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleExportExcel = async () => {
    const loadingToast = toast.loading("جاري تصدير البيانات...");
    try {
      const response = await fetch("/api/customers/export");
      const data = await response.json();
      exportToExcel(data, "customers");
      toast.update(loadingToast, {
        render: "تم تصدير البيانات بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء تصدير البيانات",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Error exporting data:", error);
    }
  };

  const handlePrint = async () => {
    const loadingToast = toast.loading("جاري إنشاء التقرير...");
    try {
      const response = await fetch("/api/customers/export");
      const data = await response.json();
      await generateCustomerReport(data);
      toast.update(loadingToast, {
        render: "تم إنشاء التقرير بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء إنشاء التقرير",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Error generating report:", error);
    }
  };



  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة العملاء"
        onAdd={handleAdd}
        addLabel="إضافة عميل"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outlined"
              startIcon={<IconFileImport />}
              onClick={() => setImportDialogOpen(true)}
            >
              استيراد
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconFileExport />}
              onClick={handleExportExcel}
            >
              تصدير
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconPrinter />}
              onClick={handlePrint}
            >
              طباعة
            </Button>
          </div>
        }
      />

      <Box className="mb-6">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <SearchInput
              onSearch={setSearchQuery}
              placeholder="البحث في العملاء..."
        />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={types}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="النوع" />
              )}
              onChange={(_, newValue) => {
                setType(newValue?.id || '');
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {isLoading ? <Loading /> : data && <DataTable
        columns={columns}
        data={data?.customers || []}
        loading={isLoading}
        page={page}
        totalCount={data?.total || 0}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />}

      {isLoading ? <Loading /> : data && (
        <CustomerFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={selectedCustomer}
          loading={formLoading}
        />
      )}

      {isLoading ? <Loading /> : data && (
        <ConfirmDialog
          open={deleteDialogOpen}
        title="حذف العميل"
        message={`هل أنت متأكد من حذف العميل "${selectedCustomer?.name}"؟`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={formLoading}
      />
      )}

      {isLoading ? <Loading /> : data && (
        <ExcelImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSuccess={refetchCustomers}
        />
      )}
    </div>
  );
}

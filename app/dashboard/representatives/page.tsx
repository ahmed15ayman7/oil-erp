"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RepresentativeFormDialog } from "@/app/components/representatives/representative-form-dialog";
import { SearchInput } from "@/components/search-input";
import { Box, Chip, Button } from "@mui/material";
import { toast } from "react-toastify";
import { IconFileExport, IconFileImport } from "@tabler/icons-react";
import { ExcelImportDialog } from "@/app/components/representatives/excel-import-dialog";
import { StatsCards } from "@/app/components/representatives/stats-cards";

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
    id: "area",
    label: "المنطقة",
  },
  {
    id: "status",
    label: "الحالة",
    format: (value: string) => {
      const statusMap = {
        ACTIVE: { label: "نشط", color: "success" },
        ON_LEAVE: { label: "في إجازة", color: "warning" },
        INACTIVE: { label: "غير نشط", color: "error" },
      };
      const status = statusMap[value as keyof typeof statusMap];
      return <Chip label={status.label} color={status.color as any} size="small" />;
    },
  },
];

export default function RepresentativesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRepresentative, setSelectedRepresentative] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const {
    data,
    isLoading,
    refetch: refetchRepresentatives,
  } = useQuery({
    queryKey: ["representatives", page, rowsPerPage, searchQuery],
    queryFn: async () => {
      const response = await fetch(
        `/api/representatives?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}`
      );
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء جلب البيانات");
      }
      return response.json();
    },
  });

  const handleAdd = () => {
    setSelectedRepresentative(null);
    setFormOpen(true);
  };

  const handleEdit = (representative: any) => {
    setSelectedRepresentative(representative);
    setFormOpen(true);
  };

  const handleDelete = (representative: any) => {
    setSelectedRepresentative(representative);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    const loadingToast = toast.loading(
      selectedRepresentative ? "جاري تحديث البيانات..." : "جاري إضافة المندوب..."
    );
    setFormLoading(true);
    try {
      if (selectedRepresentative) {
        await fetch("/api/representatives", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            id: selectedRepresentative.id,
          }),
        });
        toast.update(loadingToast, {
          render: "تم تحديث بيانات المندوب بنجاح",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        await fetch("/api/representatives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        toast.update(loadingToast, {
          render: "تم إضافة المندوب بنجاح",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      setFormOpen(false);
      refetchRepresentatives();
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
    const loadingToast = toast.loading("جاري حذف المندوب...");
    setFormLoading(true);
    try {
      await fetch(`/api/representatives?id=${selectedRepresentative.id}`, {
        method: "DELETE",
      });
      toast.update(loadingToast, {
        render: "تم حذف المندوب بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      setDeleteDialogOpen(false);
      refetchRepresentatives();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء حذف المندوب",
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
      const response = await fetch("/api/representatives/export");
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء تصدير البيانات");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "representatives.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.update(loadingToast, {
        render: "تم تصدير البيانات بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء تصدير البيانات",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المندوبين"
        onAdd={handleAdd}
        addLabel="إضافة مندوب"
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
          </div>
        }
      />

      {isLoading ? (
        <Loading />
      ) : (
        data?.stats && <StatsCards stats={data.stats} />
      )}

      <Box className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="البحث في المندوبين..."
        />
      </Box>

      {isLoading ? (
        <Loading />
      ) : (
        data && (
          <DataTable
            columns={columns}
            data={data?.representatives || []}
            loading={isLoading}
            page={page}
            totalCount={data?.total || 0}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )
      )}

      <RepresentativeFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedRepresentative}
        loading={formLoading}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="حذف المندوب"
        message={`هل أنت متأكد من حذف المندوب "${selectedRepresentative?.name}"؟`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={formLoading}
      />

      <ExcelImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={refetchRepresentatives}
      />
    </div>
  );
}

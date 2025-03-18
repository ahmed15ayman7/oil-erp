"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AssetFormDialog } from "@/components/assets/asset-form-dialog";
import { SearchInput } from "@/components/search-input";
import { Box, Chip, Button } from "@mui/material";
import { toast } from "react-toastify";
import { IconFileExport, IconFileImport, IconPlus } from "@tabler/icons-react";
import { ExcelImportDialog } from "@/components/assets/excel-import-dialog";
import { StatsCards } from "@/components/assets/stats-cards";
import dayjs from "dayjs";
import { ProductionChart } from '@/components/assets/production-chart';

const columns = [
  {
    id: "name",
    label: "اسم الأصل",
  },
  {
    id: "type",
    label: "النوع",
    format: (value: string) => {
      const typeMap = {
        MACHINE: { label: "ماكينة", color: "primary" },
        EQUIPMENT: { label: "معدات", color: "info" },
        VEHICLE: { label: "مركبة", color: "secondary" },
        OTHER: { label: "أخرى", color: "default" },
      };
      const type = typeMap[value as keyof typeof typeMap];
      return <Chip label={type.label} color={type.color as any} size="small" />;
    },
  },
  {
    id: "value",
    label: "القيمة",
    format: (value: number) =>
      value.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }),
  },
  {
    id: "maxMaterials",
    label: "الحد الأقصى",
    format: (value: number) => value.toLocaleString("ar-EG"),
  },
  {
    id: "purchaseDate",
    label: "تاريخ الشراء",
    format: (value: string) => dayjs(value).format("DD/MM/YYYY"),
  },
  {
    id: "nextMaintenance",
    label: "موعد الصيانة القادمة",
    format: (value: string) =>
      value ? dayjs(value).format("DD/MM/YYYY") : "غير محدد",
  },
  {
    id: "status",
    label: "الحالة",
    format: (value: string) => {
      const statusMap = {
        ACTIVE: { label: "نشط", color: "success" },
        MAINTENANCE: { label: "في الصيانة", color: "warning" },
        INACTIVE: { label: "غير نشط", color: "error" },
      };
      const status = statusMap[value as keyof typeof statusMap];
      return <Chip label={status.label} color={status.color as any} size="small" />;
    },
  },
];

export default function AssetsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const {
    data,
    isLoading,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: ["assets", page, rowsPerPage, searchQuery],
    queryFn: async () => {
      const response = await fetch(
        `/api/assets?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}`
      );
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء جلب البيانات");
      }
      return response.json();
    },
  });
useEffect(() => {
  refetchAssets();
}, [searchQuery, page, rowsPerPage]);
  const handleAdd = () => {
    setSelectedAsset(null);
    setFormOpen(true);
  };

  const handleEdit = (asset: any) => {
    setSelectedAsset(asset);
    setFormOpen(true);
  };

  const handleDelete = (asset: any) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    const loadingToast = toast.loading(
      selectedAsset ? "جاري تحديث البيانات..." : "جاري إضافة الأصل..."
    );
    setFormLoading(true);
    try {
      if (selectedAsset) {
        let response=  await fetch("/api/assets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            id: selectedAsset.id,
          }),
        });
        if (!response.ok) {
         toast.update(loadingToast, {
          render: "حدث خطأ أثناء تحديث بيانات الأصل",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        return
        }
        toast.update(loadingToast, {
          render: "تم تحديث بيانات الأصل بنجاح",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
      let response=  await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
         toast.update(loadingToast, {
          render: "حدث خطأ أثناء إضافة الأصل",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        return
        }
        toast.update(loadingToast, {
          render: "تم إضافة الأصل بنجاح",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      setFormOpen(false);
      refetchAssets();
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
    const loadingToast = toast.loading("جاري حذف الأصل...");
    setFormLoading(true);
    try {
      await fetch(`/api/assets?id=${selectedAsset.id}`, {
        method: "DELETE",
      });
      toast.update(loadingToast, {
        render: "تم حذف الأصل بنجاح",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      setDeleteDialogOpen(false);
      refetchAssets();
    } catch (error) {
      toast.update(loadingToast, {
        render: "حدث خطأ أثناء حذف الأصل",
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
      const response = await fetch("/api/assets/export");
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء تصدير البيانات");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "assets.xlsx";
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
        title="إدارة الأصول"
        onAdd={handleAdd}
        addLabel="إضافة أصل"
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

      <ProductionChart assets={data?.assets || []} />

      <Box className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="البحث في الأصول..."
        />
      </Box>

      {isLoading ? (
        <Loading />
      ) : (
        data && (
          <DataTable
            columns={columns}
            data={data?.assets || []}
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

      <AssetFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedAsset}
        loading={formLoading}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="حذف الأصل"
        message={`هل أنت متأكد من حذف الأصل "${selectedAsset?.name}"؟`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={formLoading}
      />

      <ExcelImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={refetchAssets}
      />
    </div>
  );
}

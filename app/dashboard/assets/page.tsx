"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AssetFormDialog } from "@/components/assets/asset-form-dialog";
import { SearchInput } from "@/components/search-input";
import { Box, Button, Chip } from "@mui/material";
import { useApi } from "@/hooks/use-api";
import { IconFileExport, IconPrinter } from "@tabler/icons-react";

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
        EQUIPMENT: { label: "معدات", color: "secondary" },
        VEHICLE: { label: "مركبة", color: "success" },
        OTHER: { label: "أخرى", color: "default" },
      };
      const type = typeMap[value as keyof typeof typeMap];
      return <Chip label={type.label} color={type.color as any} size="small" />;
    },
  },
  {
    id: "purchaseDate",
    label: "تاريخ الشراء",
    format: (value: string) => new Date(value).toLocaleDateString("ar-EG"),
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
    id: "nextMaintenance",
    label: "الصيانة القادمة",
    format: (value: string) => new Date(value).toLocaleDateString("ar-EG"),
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
      return (
        <Chip label={status.label} color={status.color as any} size="small" />
      );
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
  const api = useApi();

  const {
    data,
    isLoading,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: ["assets", page, rowsPerPage, searchQuery],
    queryFn: () =>
      api.get(
        `/api/assets?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}`
      ),
  });

  const handleExportExcel = async () => {
    try {
      const response = await api.get("/api/assets/export");
      // تنفيذ تصدير Excel
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handlePrint = async () => {
    try {
      const response = await api.get("/api/assets/report");
      // تنفيذ الطباعة
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const handleEdit = (asset: any) => {
    setSelectedAsset(asset);
    setFormOpen(true);
  };

  const handleDelete = (asset: any) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الأصول الثابتة"
        actions={
          <div className="flex gap-2">
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
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="البحث في الأصول..."
        />
      </Box>

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

      {/* ... dialogs ... */}
    </div>
  );
}

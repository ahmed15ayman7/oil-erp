"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { Box, Button, Chip } from "@mui/material";
import { useApi } from "@/hooks/use-api";
import { IconFileExport, IconPrinter } from "@tabler/icons-react";
import { SearchInput } from "@/components/search-input";

const columns = [
  {
    id: "name",
    label: "اسم المندوب",
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
      return (
        <Chip label={status.label} color={status.color as any} size="small" />
      );
    },
  },
  {
    id: "todaySales",
    label: "مبيعات اليوم",
    format: (value: number) =>
      value.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }),
  },
  {
    id: "monthSales",
    label: "مبيعات الشهر",
    format: (value: number) =>
      value.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }),
  },
];

export default function RepresentativesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const api = useApi();

  const {
    data,
    isLoading,
    refetch: refetchRepresentatives,
  } = useQuery({
    queryKey: ["representatives", page, rowsPerPage, searchQuery],
    queryFn: () =>
      api.get(
        `/api/representatives?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}`
      ),
  });

  const handleExportExcel = () => {
    // Implementation of export to Excel
  };

  const handlePrint = () => {
    // Implementation of print
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المندوبين"
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
          placeholder="البحث في المندوبين..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={data?.representatives || []}
        loading={isLoading}
        page={page}
        totalCount={data?.total || 0}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </div>
  );
}

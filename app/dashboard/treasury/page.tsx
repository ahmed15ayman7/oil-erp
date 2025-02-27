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
    id: "date",
    label: "التاريخ",
    format: (value: string) => new Date(value).toLocaleDateString("ar-EG"),
  },
  {
    id: "type",
    label: "النوع",
    format: (value: string) => {
      const typeMap = {
        INCOME: { label: "إيراد", color: "success" },
        EXPENSE: { label: "مصروف", color: "error" },
      };
      const type = typeMap[value as keyof typeof typeMap];
      return <Chip label={type.label} color={type.color as any} size="small" />;
    },
  },
  {
    id: "category",
    label: "التصنيف",
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
    id: "description",
    label: "الوصف",
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

export default function TreasuryPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const api = useApi();

  const { data, isLoading } = useQuery({
    queryKey: ["treasury", page, rowsPerPage, searchQuery],
    queryFn: () =>
      api.get(
        `/api/treasury?page=${
          page + 1
        }&limit=${rowsPerPage}&search=${searchQuery}`
      ),
  });

  const handleExportExcel = async () => {
    try {
      const response = await api.get("/api/treasury/export");
      // تنفيذ تصدير Excel
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handlePrint = async () => {
    try {
      const response = await api.get("/api/treasury/report");
      // تنفيذ الطباعة
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الخزينة"
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
          placeholder="البحث في المعاملات..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={data?.transactions || []}
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

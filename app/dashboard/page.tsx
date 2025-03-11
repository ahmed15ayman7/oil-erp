"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Grid } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { DashboardStats } from "@/components/dashboard/stats";
import { ProductionChart } from "@/components/dashboard/charts/production-chart";
import { SalesAnalytics } from "@/components/dashboard/charts/sales-analytics";
import { InventoryStatus } from "@/components/dashboard/charts/inventory-status";
import { MaterialsUsage } from "@/components/dashboard/charts/materials-usage";
import { DeliveryStatus } from "@/components/dashboard/charts/delivery-status";
import { CategoriesManagement } from "@/components/dashboard/categories-management";
import { UnitsManagement } from "@/components/dashboard/units-management";
import { useWebSocket } from "@/hooks/use-websocket";
import { LoadingOverlay } from "@/components/loading-overlay";
import { DateRange } from "@/components/dashboard/date-range-selector";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // استخدام React Query لجلب البيانات
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["dashboardStats", dateRange, currentDate],
    queryFn: () =>
      fetch(`/api/dashboard/stats?range=${dateRange}&date=${currentDate.toISOString()}`)
        .then((res) => res.json()),
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // جلب بيانات التصنيفات
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });

  // جلب بيانات الوحدات
  const { data: units, isLoading: unitsLoading, refetch: refetchUnits } = useQuery({
    queryKey: ["units"],
    queryFn: () => fetch("/api/units").then((res) => res.json()),
  });

  // إعداد WebSocket للتحديثات المباشرة
  useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/api/websocket",
    onMessage: (data: string) => {
      const parsedData = JSON.parse(data);
      if (parsedData.type === 'stats') {
        queryClient.setQueryData(["dashboardStats", dateRange, currentDate], (oldData: any) => ({
          ...oldData,
          ...parsedData.data,
        }));
      } else if (parsedData.type === 'categories') {
        refetchCategories();
      } else if (parsedData.type === 'units') {
        refetchUnits();
      }
    },
  });

  const handleDateRangeChange = (range: DateRange, date: Date) => {
    setDateRange(range);
    setCurrentDate(date);
  };

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-error">حدث خطأ أثناء تحميل البيانات</p>
      </div>
    );
  }

  const isLoading = statsLoading || categoriesLoading || unitsLoading;
  console.log("data", stats)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="space-y-6"
      >
        <PageHeader title="لوحة التحكم" />

        {isLoading ? (
          <LoadingOverlay />
        ) : (
          <>
            <DashboardStats stats={stats} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <ProductionChart
                    data={stats.production}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <SalesAnalytics
                    data={stats.sales}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <InventoryStatus
                    data={{ ...stats.inventory, lowStockProducts: stats.analytics.lowStockProducts }}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <MaterialsUsage data={stats.production.materials} />
                </motion.div>
              </Grid>

              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <DeliveryStatus
                    vehicles={stats.vehicles}
                    deliveries={stats.analytics.deliveries}
                  />
                </motion.div>
              </Grid>

              {/* إدارة التصنيفات والوحدات */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <CategoriesManagement
                    categories={categories}
                    onUpdate={refetchCategories}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <UnitsManagement
                    units={units}
                    onUpdate={refetchUnits}
                  />
                </motion.div>
              </Grid>
            </Grid>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Grid, Box, useTheme, useMediaQuery } from "@mui/material";
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
import { IconPackage, IconReportMoney, IconUsers } from "@tabler/icons-react";
import { StatsCard } from "@/components/stats-card";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },

};
export default function DashboardPage() {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // استخدام React Query لجلب البيانات مع تحسين الأداء
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["dashboardStats", dateRange, currentDate],
    queryFn: () =>
      fetch(`/api/dashboard/stats?range=${dateRange}&date=${currentDate.toISOString()}`)
        .then((res) => res.json()),
    refetchInterval: 30000,
    staleTime: 10000, // البيانات تبقى طازجة لمدة 10 ثواني
    gcTime: 5 * 60 * 1000, // تخزين مؤقت لمدة 5 دقائق
  });

  // جلب بيانات التصنيفات والوحدات بشكل منفصل
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
    staleTime: 5 * 60 * 1000, // تخزين مؤقت لمدة 5 دقائق
  });

  const { data: units, isLoading: unitsLoading, refetch: refetchUnits } = useQuery({
    queryKey: ["units"],
    queryFn: () => fetch("/api/units").then((res) => res.json()),
    staleTime: 5 * 60 * 1000, // تخزين مؤقت لمدة 5 دقائق
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
  const statCards = [
    {
      title: "رصيد الخزنة",
      value: !isLoading ? stats.treasury.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }) : "0",
      icon: <IconReportMoney className="w-8 h-8" />,
      color: "warning.main",
    },
    {
      title: "العملاء",
      value: !isLoading ? stats.counts.customers.toLocaleString() : "0",
      icon: <IconUsers className="w-8 h-8" />,
      color: "secondary.main",
    },
    {
      title: "المنتجات",
      value: !isLoading ? stats.counts.products.toLocaleString() : "0",
      icon: <IconPackage className="w-8 h-8" />,
      color: "error.main",
    },
  ];
  console.log(stats)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="space-y-4 md:space-y-6 p-4 md:p-6"
      >
        <PageHeader title="لوحة التحكم" />

        {isLoading ? (
          <LoadingOverlay />
        ) : (
          <>
            <DashboardStats stats={stats} />

            <Grid container spacing={3}>

              <Grid item xs={12} md={4}>
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="mb-6"
                >
                  <Grid container direction="column" spacing={3}>
                    {statCards.map((card, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={4} key={card.title}>
                        <motion.div variants={item}>
                          <StatsCard {...card} />
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              </Grid>
              <Grid item xs={12} md={8}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="h-full"
                >
                  <ProductionChart
                    data={stats.production}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12} md={12}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="h-full"
                >
                  <SalesAnalytics
                    data={stats.sales}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </motion.div>
              </Grid>

              {/* المخزون والموارد */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="h-full"
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
                  className="h-full"
                >
                  <MaterialsUsage data={stats.production.materials} />
                </motion.div>
              </Grid>

              {/* التوصيل */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="h-full"
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
                  className="h-full"
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
                  className="h-full"
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

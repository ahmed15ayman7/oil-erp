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
import dayjs from "dayjs";

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

  const [dateRange, setDateRange] = useState<DateRange>("day");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [type,setType]=useState<"sales" | "inventory" | "production">("sales")

  // استخدام React Query لجلب البيانات الأساسية
  const { data: basicStats, isLoading: basicStatsLoading } = useQuery({
    queryKey: ["dashboardBasicStats"],
    queryFn: () => fetch(`/api/dashboard/stats?type=basic`).then((res) => res.json()),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // جلب بيانات المبيعات
  const { data: salesData, isLoading: salesLoading,refetch: refetchSales } = useQuery({
    queryKey: ["dashboardSales", dateRange, currentDate],
    queryFn: () =>
      fetch(`/api/dashboard/stats?type=sales&range=${dateRange}&date=${currentDate.toISOString()}`).then((res) => res.json()),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // جلب بيانات المخزون
  const { data: inventoryData, isLoading: inventoryLoading ,refetch: refetchInventory} = useQuery({
    queryKey: ["dashboardInventory", dateRange, currentDate],
    queryFn: () =>
      fetch(`/api/dashboard/stats?type=inventory&range=${dateRange}&date=${currentDate.toISOString()}`).then((res) => res.json()),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // جلب بيانات الإنتاج
  const { data: productionData, isLoading: productionLoading,refetch: refetchProduction } = useQuery({
    queryKey: ["dashboardProduction", dateRange, currentDate],
    queryFn: () =>
      fetch(`/api/dashboard/stats?type=production&range=${dateRange}&date=${currentDate.toISOString()}`).then((res) => res.json()),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // جلب بيانات التصنيفات والوحدات
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
    staleTime: 5 * 60 * 1000,
  });

  const { data: units, isLoading: unitsLoading, refetch: refetchUnits } = useQuery({
    queryKey: ["units"],
    queryFn: () => fetch("/api/units").then((res) => res.json()),
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    if (type === 'sales') {
      refetchSales();
    } else if (type === 'inventory') {
      refetchInventory();
    } else if (type === 'production') {
      refetchProduction();
    }
  }, [type, dateRange, currentDate]);
  // إعداد WebSocket للتحديثات المباشرة
  useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/api/websocket",
    onMessage: (data: string) => {
      const parsedData = JSON.parse(data);
      if (parsedData.type === 'stats') {
        queryClient.invalidateQueries({ queryKey: ["dashboardBasicStats"] });
        queryClient.invalidateQueries({ queryKey: ["dashboardSales"] });
        queryClient.invalidateQueries({ queryKey: ["dashboardInventory"] });
        queryClient.invalidateQueries({ queryKey: ["dashboardProduction"] });
      } else if (parsedData.type === 'categories') {
        refetchCategories();
      } else if (parsedData.type === 'units') {
        refetchUnits();
      }
    },
  });

  const handleDateRangeChange = (range: DateRange, date: dayjs.Dayjs,type: string) => {
    setDateRange(range);
    setCurrentDate(date);
    setType(type as "sales" | "inventory" | "production");

  };

  const isBasicLoading = basicStatsLoading;

  const statCards = [
    {
      title: "رصيد الخزنة",
      value: !isBasicLoading ? basicStats?.treasury.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }) : "0",
      icon: <IconReportMoney className="w-8 h-8" />,
      color: "warning.main",
      isLoading: isBasicLoading,
    },
    {
      title: "العملاء",
      value: !isBasicLoading ? basicStats?.counts.customers.toLocaleString() : "0",
      icon: <IconUsers className="w-8 h-8" />,
      color: "secondary.main",
      isLoading: isBasicLoading,
    },
    {
      title: "المنتجات",
      value: !isBasicLoading ? basicStats?.counts.products.toLocaleString() : "0",
      icon: <IconPackage className="w-8 h-8" />,
      color: "error.main",
      isLoading: isBasicLoading,
    },
  ];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="space-y-4 md:space-y-6 p-4 md:p-6"
      >
        <PageHeader title="لوحة التحكم" />

        {isBasicLoading ? (
          <LoadingOverlay />
        ) : (
          <>
            <DashboardStats stats={basicStats} />

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
                    data={productionData || { history: [] }}
                    onDateRangeChange={handleDateRangeChange}
                    isLoading={productionLoading}
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
                    data={salesData || { history: [] }}
                    onDateRangeChange={handleDateRangeChange}
                    isLoading={salesLoading}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="h-full"
                >
                  <InventoryStatus
                    data={inventoryData || { history: [], lowStockProducts: [] }}
                    onDateRangeChange={handleDateRangeChange}
                    isLoading={inventoryLoading}
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
                  <MaterialsUsage
                    data={productionData?.materials || { history: [], currentStock: [] }}
                    onDateRangeChange={handleDateRangeChange}
                    isLoading={productionLoading}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="h-full"
                >
                {!isBasicLoading && (<DeliveryStatus
                    vehicles={basicStats?.vehicles || []}
                    deliveries={basicStats?.deliveries || []}
                    
                  />
                  )}
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="h-full"
                >
                 {!categoriesLoading&& <CategoriesManagement
                    categories={categories}
                    onUpdate={refetchCategories}
                    
                  />}
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="h-full"
                >
                 {!unitsLoading && (<UnitsManagement
                    units={units}
                    onUpdate={refetchUnits}
                  />)}
                </motion.div>
              </Grid>
            </Grid>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

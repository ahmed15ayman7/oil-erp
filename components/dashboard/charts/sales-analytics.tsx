'use client';

import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Chip,
  Skeleton,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { DateRangeSelector, DateRange } from "../date-range-selector";
import { useState, useCallback, useMemo } from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

interface SalesAnalyticsProps {
  data: {
    history: SalesData[];
    totalRevenue: number;
    totalOrders: number;
    growth?: {
      revenue: number;
      orders: number;
    };
  };
  onDateRangeChange: (range: DateRange, date: dayjs.Dayjs, type: string) => void;
  isLoading?: boolean;
}

// إضافة مكون التحميل للرسم البياني
const ChartLoadingAnimation = () => {
  const theme = useTheme();
  return (
    <svg width="100%" height="300">
      <motion.path
        d="M0,150 C100,100 200,200 300,150 C400,100 500,200 600,150"
        fill="none"
        stroke={theme.palette.primary.main}
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: 1,
          opacity: 0.3,
          transition: {
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          },
        }}
      />
    </svg>
  );
};

export function SalesAnalytics({ data, onDateRangeChange, isLoading = false }: SalesAnalyticsProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>("day");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [isChangingRange, setIsChangingRange] = useState(false);

  const handleRangeChange = useCallback((range: DateRange) => {
    setIsChangingRange(true);
    setDateRange(range);

    // التحقق من وجود البيانات في التخزين المؤقت
    const cachedData = queryClient.getQueryData(["dashboardStats", "sales", range, currentDate]);

    if (!cachedData) {
      onDateRangeChange(range, currentDate, 'sales');
    } else {
      // استخدام البيانات المخزنة مؤقتاً
      queryClient.setQueryData(["dashboardStats", "sales", range, currentDate], cachedData);
    }

    setTimeout(() => setIsChangingRange(false), 500);
  }, [currentDate, onDateRangeChange, queryClient]);

  const handleDateChange = useCallback((date: dayjs.Dayjs) => {
    setCurrentDate(date);
    onDateRangeChange(dateRange, date, 'sales');
  }, [dateRange, onDateRangeChange]);



  // حساب القيم المطلوبة مرة واحدة فقط عند تغير البيانات
  const { averageOrderValue, growth } = useMemo(() => ({
    averageOrderValue: data.totalRevenue / data.totalOrders || 0,
    growth: data.growth || { revenue: 0, orders: 0 }
  }), [data.totalRevenue, data.totalOrders, data.growth]);

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <CardHeader
        title={
          <Box className="flex justify-between items-center">
            <Typography variant="h6">تحليلات المبيعات</Typography>
            <DateRangeSelector
              range={dateRange}
              onRangeChange={handleRangeChange}
              onDateChange={handleDateChange}
              currentDate={currentDate}
            />
          </Box>
        }
      />
      <CardContent>
        <AnimatePresence mode="wait">
          {(isLoading || isChangingRange) ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                  <Box key={i} className="p-4 rounded-lg bg-black/5 dark:bg-white/5">
                    <Skeleton variant="text" width={120} height={24} />
                    <Skeleton variant="text" width={150} height={32} className="mt-1" />
                  </Box>
                ))}
              </Box>
              <ChartLoadingAnimation />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Box className="p-4 rounded-lg bg-black/5 dark:bg-white/5">
                  <Box className="flex justify-between items-start">
                    <Typography variant="subtitle2" color="text.secondary">
                      إجمالي الإيرادات
                    </Typography>
                    {growth.revenue !== 0 && (
                      <Chip
                        icon={
                          growth.revenue > 0 ? (
                            <IconTrendingUp className="w-4 h-4" />
                          ) : (
                            <IconTrendingDown className="w-4 h-4" />
                          )
                        }
                        label={`${Math.abs(growth.revenue)}%`}
                        color={growth.revenue > 0 ? "success" : "error"}
                        size="small"
                      />
                    )}
                  </Box>
                  <Typography variant="h4" className="mt-1">
                    {data.totalRevenue.toLocaleString("ar-EG", {
                      style: "currency",
                      currency: "EGP",
                    })}
                  </Typography>
                </Box>
                <Box className="p-4 rounded-lg bg-primary/10">
                  <Box className="flex justify-between items-start">
                    <Typography variant="subtitle2" color="primary">
                      عدد الطلبات
                    </Typography>
                    {growth.orders !== 0 && (
                      <Chip
                        icon={
                          growth.orders > 0 ? (
                            <IconTrendingUp className="w-4 h-4" />
                          ) : (
                            <IconTrendingDown className="w-4 h-4" />
                          )
                        }
                        label={`${Math.abs(growth.orders)}%`}
                        color={growth.orders > 0 ? "success" : "error"}
                        size="small"
                      />
                    )}
                  </Box>
                  <Typography variant="h4" className="mt-1" color="primary">
                    {data.totalOrders.toLocaleString()}
                  </Typography>
                </Box>
                <Box className="p-4 rounded-lg bg-success/10">
                  <Typography variant="subtitle2" color="success.main">
                    متوسط قيمة الطلب
                  </Typography>
                  <Typography variant="h4" className="mt-1" color="success.main">
                    {averageOrderValue.toLocaleString("ar-EG", {
                      style: "currency",
                      currency: "EGP",
                      maximumFractionDigits: 0,
                    })}
                  </Typography>
                </Box>
              </Box>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.history}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={theme.palette.text.secondary}
                      tick={{ fill: theme.palette.text.secondary }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke={theme.palette.text.secondary}
                      tick={{ fill: theme.palette.text.secondary }}
                      tickFormatter={(value) =>
                        value.toLocaleString("ar-EG", {
                          style: "currency",
                          currency: "EGP",
                          maximumFractionDigits: 0,
                        })
                      }
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={theme.palette.primary.main}
                      tick={{ fill: theme.palette.primary.main }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                     
                      formatter={(value: number, name: string) => {
                        if (name === "revenue") {
                          return [
                            value.toLocaleString("ar-EG", {
                              style: "currency",
                              currency: "EGP",
                            }),
                            "الإيرادات",
                          ];
                        }
                        if (name === "orders") {
                          return [value.toLocaleString(), "الطلبات"];
                        }
                        if (name === "averageOrderValue") {
                          return [
                            value.toLocaleString("ar-EG", {
                              style: "currency",
                              currency: "EGP",
                            }),
                            "متوسط قيمة الطلب",
                          ];
                        }
                        return [value, name];
                      }}
                      labelStyle={{ color: theme.palette.text.primary }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="الإيرادات"
                      stroke={theme.palette.success.main}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name="الطلبات"
                      stroke={theme.palette.primary.main}
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="averageOrderValue"
                      name="متوسط قيمة الطلب"
                      stroke={theme.palette.warning.main}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
} 
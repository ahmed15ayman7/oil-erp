'use client';

import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Chip,
  Tooltip,
  Skeleton,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { DateRangeSelector, DateRange } from "../date-range-selector";
import { useState } from "react";
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';

interface InventoryStatusProps {
  data: {
    total: number;
    lowStock: number;
    history: {
      date: string;
      inStock: number;
      added: number;
      removed: number;
    }[];
    lowStockProducts: {
      id: string;
      name: string;
      quantity: number;
      minQuantity: number;
    }[];
  };
  onDateRangeChange: (range: DateRange, date: Date) => void;
  isLoading?: boolean;
}

// مكون التحميل للرسم البياني
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

export function InventoryStatus({ data, onDateRangeChange, isLoading = false }: InventoryStatusProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isChangingRange, setIsChangingRange] = useState(false);

  const handleRangeChange = (range: DateRange) => {
    setIsChangingRange(true);
    setDateRange(range);

    // التحقق من وجود البيانات في التخزين المؤقت
    const cachedData = queryClient.getQueryData(["dashboardStats", "inventory", range, currentDate]);

    if (!cachedData) {
      onDateRangeChange(range, currentDate);
    } else {
      // استخدام البيانات المخزنة مؤقتاً
      queryClient.setQueryData(["dashboardStats", "inventory", range, currentDate], cachedData);
    }

    setTimeout(() => setIsChangingRange(false), 500);
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    onDateRangeChange(dateRange, date);
  };

  // تنسيق محور X حسب نطاق التاريخ
  const formatXAxis = (value: string) => {
    switch (dateRange) {
      case 'day':
        return dayjs(value).format('HH:mm');
      case 'week':
        return dayjs(value).format('ddd');
      case 'month':
        return `أسبوع ${dayjs(value).isoWeek()}`;
      case 'year':
        return dayjs(value).format('MMM');
      default:
        return value;
    }
  };

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
            <Typography variant="h6">حالة المخزون</Typography>
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
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[1, 2].map((i) => (
                  <Box key={i} className="p-4 rounded-lg bg-black/5 dark:bg-white/5">
                    <Skeleton variant="text" width={120} height={24} />
                    <Skeleton variant="text" width={150} height={32} className="mt-1" />
                  </Box>
                ))}
              </Box>
              <ChartLoadingAnimation />
              <Box className="mt-6">
                <Skeleton variant="text" width={200} height={24} className="mb-2" />
                <Box className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rounded" width={100} height={32} />
                  ))}
                </Box>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Box className="p-4 rounded-lg bg-black/5 dark:bg-white/5">
                  <Typography variant="subtitle2" color="text.secondary">
                    إجمالي المخزون
                  </Typography>
                  <Typography variant="h4" className="mt-1">
                    {data.total.toLocaleString()}
                  </Typography>
                </Box>
                <Box className="p-4 rounded-lg bg-error/10">
                  <Typography variant="subtitle2" color="error">
                    منتجات منخفضة المخزون
                  </Typography>
                  <Typography variant="h4" className="mt-1" color="error">
                    {data.lowStock.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.history}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={theme.palette.text.secondary}
                      tick={{ fill: theme.palette.text.secondary }}
                      tickFormatter={formatXAxis}
                    />
                    <YAxis
                      stroke={theme.palette.text.secondary}
                      tick={{ fill: theme.palette.text.secondary }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                      labelFormatter={formatXAxis}
                      formatter={(value: number) => [value.toLocaleString(), ""]}
                      labelStyle={{ color: theme.palette.text.primary }}
                    />
                    <Bar
                      dataKey="added"
                      name="تمت الإضافة"
                      fill={theme.palette.success.main}
                      opacity={0.8}
                    />
                    <Bar
                      dataKey="removed"
                      name="تم السحب"
                      fill={theme.palette.error.main}
                      opacity={0.8}
                    />
                    <Line
                      type="monotone"
                      dataKey="inStock"
                      name="المخزون"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {data.lowStockProducts.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" className="mb-2">
                    المنتجات منخفضة المخزون
                  </Typography>
                  <div className="flex flex-wrap gap-2">
                    {data.lowStockProducts.map((product) => (
                      <Tooltip
                        key={product.id}
                        title={`الكمية الحالية: ${product.quantity} | الحد الأدنى: ${product.minQuantity}`}
                      >
                        <Chip
                          label={product.name}
                          color="error"
                          variant="outlined"
                          size="small"
                        />
                      </Tooltip>
                    ))}
                  </div>
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
} 
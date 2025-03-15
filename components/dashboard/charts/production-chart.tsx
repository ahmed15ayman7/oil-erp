'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Skeleton,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { DateRangeSelector, DateRange } from '../date-range-selector';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';

interface ProductionChartProps {
  data: {
    history: {
      date: string;
      quantity: number;
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

export function ProductionChart({ data, onDateRangeChange, isLoading = false }: ProductionChartProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isChangingRange, setIsChangingRange] = useState(false);

  const handleRangeChange = (range: DateRange) => {
    setIsChangingRange(true);
    setDateRange(range);

    // التحقق من وجود البيانات في التخزين المؤقت
    const cachedData = queryClient.getQueryData(["dashboardStats", "production", range, currentDate]);

    if (!cachedData) {
      onDateRangeChange(range, currentDate);
    } else {
      // استخدام البيانات المخزنة مؤقتاً
      queryClient.setQueryData(["dashboardStats", "production", range, currentDate], cachedData);
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

  // حساب إجمالي الإنتاج للفترة المحددة
  const totalProduction = !isLoading ? data.history.reduce(
    (sum, item) => sum + item.quantity,
    0
  ) : 0;

  // حساب متوسط الإنتاج اليومي
  const averageProduction = !isLoading ? totalProduction / (data.history.length || 1) : 0;
  console.log(data.history)
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
            <Typography variant="h6">الإنتاج</Typography>
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
                    إجمالي الإنتاج
                  </Typography>
                  <Typography variant="h4" className="mt-1">
                    {totalProduction.toLocaleString()}
                  </Typography>
                </Box>
                <Box className="p-4 rounded-lg bg-primary/10">
                  <Typography variant="subtitle2" color="primary">
                    متوسط الإنتاج اليومي
                  </Typography>
                  <Typography variant="h4" className="mt-1" color="primary">
                    {averageProduction.toFixed(0)}
                  </Typography>
                </Box>
              </Box>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.history}>
                    <defs>
                      <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                      labelFormatter={formatXAxis}
                      formatter={(value: number) => [value.toLocaleString(), "الكمية"]}
                      labelStyle={{ color: theme.palette.text.primary }}
                    />
                    <Area
                      type="monotone"
                      dataKey="quantity"
                      stroke={theme.palette.primary.main}
                      fillOpacity={1}
                      fill="url(#colorProduction)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
} 
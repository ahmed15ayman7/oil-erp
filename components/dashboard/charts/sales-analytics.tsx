'use client';

import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Chip,
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
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { DateRangeSelector, DateRange } from "../date-range-selector";
import { useState } from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

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
    growth: {
      revenue: number;
      orders: number;
    };
  };
  onDateRangeChange: (range: DateRange, date: Date) => void;
}

export function SalesAnalytics({ data, onDateRangeChange }: SalesAnalyticsProps) {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range);
    onDateRangeChange(range, currentDate);
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    onDateRangeChange(dateRange, date);
  };

  // حساب متوسط قيمة الطلب
  const averageOrderValue = data.totalRevenue / data.totalOrders || 0;

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
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Box className="p-4 rounded-lg bg-black/5 dark:bg-white/5">
            <Box className="flex justify-between items-start">
              <Typography variant="subtitle2" color="text.secondary">
                إجمالي الإيرادات
              </Typography>
              <Chip
                icon={
                  data.growth.revenue >= 0 ? (
                    <IconTrendingUp className="w-4 h-4" />
                  ) : (
                    <IconTrendingDown className="w-4 h-4" />
                  )
                }
                label={`${Math.abs(data.growth.revenue)}%`}
                color={data.growth.revenue >= 0 ? "success" : "error"}
                size="small"
              />
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
              <Chip
                icon={
                  data.growth.orders >= 0 ? (
                    <IconTrendingUp className="w-4 h-4" />
                  ) : (
                    <IconTrendingDown className="w-4 h-4" />
                  )
                }
                label={`${Math.abs(data.growth.orders)}%`}
                color={data.growth.orders >= 0 ? "success" : "error"}
                size="small"
              />
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
      </CardContent>
    </Card>
  );
} 
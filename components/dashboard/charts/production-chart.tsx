'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
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
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { DateRangeSelector, DateRange } from '../date-range-selector';

interface ProductionChartProps {
  data: {
    history: {
      date: string;
      quantity: number;
    }[];
  };
  onDateRangeChange: (range: DateRange, date: Date) => void;
}

export function ProductionChart({ data, onDateRangeChange }: ProductionChartProps) {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range);
    onDateRangeChange(range, currentDate);
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    onDateRangeChange(dateRange, date);
  };

  // حساب إجمالي الإنتاج للفترة المحددة
  const totalProduction = data.history.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // حساب متوسط الإنتاج اليومي
  const averageProduction = totalProduction / data.history.length || 0;

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
      </CardContent>
    </Card>
  );
} 
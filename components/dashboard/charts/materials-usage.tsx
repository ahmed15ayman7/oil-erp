'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Skeleton,
  Grid,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { DateRangeSelector, DateRange, formatAxisDate } from '../date-range-selector';

interface MaterialsUsageProps {
  data: {
    history: {
      date: string;
      materials: {
        type: string;
        quantity: number;
        unit: string;
      }[];
    }[];
    currentStock: {
      type: string;
      quantity: number;
      unit: string;
    }[];
  };
  onDateRangeChange: (range: DateRange, date: Date) => void;
  isLoading?: boolean;
}

const materialTypes = {
  PACKAGING: 'مواد تعبئة',
  RAW_MATERIAL: 'مواد خام',
  BOTTLE: 'زجاجات',
  BOTTLE_CAP: 'أغطية',
  CARTON: 'كراتين',
  SLEEVE: 'أكمام',
  TAPE: 'شريط',
};
const unitTypes = {
  KG: 'كيلوجرام',
  METER: 'متر',
  TONNE: 'طن',
  GRAM: 'جرام',
  LITER: 'لتر',
  PIECE: 'قطعة',
  BOX: 'صندوق',
};

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

export function MaterialsUsage({ data, onDateRangeChange, isLoading = false }: MaterialsUsageProps) {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isChangingRange, setIsChangingRange] = useState(false);
  const [prevData, setPrevData] = useState(data);

  const handleRangeChange = (range: DateRange) => {
    setIsChangingRange(true);
    setDateRange(range);
    setPrevData(data);
    onDateRangeChange(range, currentDate);
    setTimeout(() => setIsChangingRange(false), 500);
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    setPrevData(data);
    onDateRangeChange(dateRange, date);
  };

  // تحويل البيانات للرسم البياني
  const chartData = !isLoading ? data.history : prevData.history;

  const formatXAxis = (date: string) => formatAxisDate(date, dateRange);

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
            <Typography variant="h6">استخدام المواد</Typography>
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
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
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
                      formatter={(value: number, name: string, props: any) => {
                        const material = props.payload.materials.find(
                          (m: any) => materialTypes[m.type as keyof typeof materialTypes] === name
                        );
                        return [
                          `${value.toLocaleString()} ${unitTypes[material?.unit as keyof typeof unitTypes] || ''}`,
                          name,
                        ];
                      }}
                      labelStyle={{ color: theme.palette.text.primary }}
                    />
                    <Legend />
                    {data.currentStock.map((material, index) => (
                      <Line
                        key={material.type}
                        type="monotone"
                        dataKey={`materials[${index}].quantity`}
                        name={materialTypes[material.type as keyof typeof materialTypes]}
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                        opacity={0.6 + (index * 0.4) / data.currentStock.length}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Grid container spacing={2}>
                {data.currentStock.map((material) => (
                  <Grid item xs={12} sm={6} md={4} key={material.type}>
                    <Box className="p-4 rounded-lg bg-black/5 text-center">
                      <Typography variant="subtitle2" color="text.secondary">
                        {materialTypes[material.type as keyof typeof materialTypes]}
                      </Typography>
                      <Typography variant="h6" className="mt-1">
                        {material.quantity.toLocaleString()}
                        <br />
                        {unitTypes[material?.unit as keyof typeof unitTypes]}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
} 
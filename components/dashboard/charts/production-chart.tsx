'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
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

interface ProductionChartProps {
  data: {
    monthly: {
      type: string;
      _sum: {
        quantity: number;
      };
    }[];
  };
}

const productionTypes = {
  FINISHED_PRODUCT: 'منتج نهائي',
  RAW_MATERIAL: 'مواد خام',
  PACKAGING: 'مواد تعبئة',
  BOTTLE: 'زجاجات',
  CARTON: 'كراتين',
};

export function ProductionChart({ data }: ProductionChartProps) {
  const theme = useTheme();
  const [view, setView] = useState<'quantity' | 'value'>('quantity');

  // تحويل البيانات إلى الشكل المطلوب للرسم البياني
  const chartData = data.monthly.map((item) => ({
    name: productionTypes[item.type as keyof typeof productionTypes],
    quantity: item._sum.quantity,
    value: item._sum.quantity * (Math.random() * 100 + 50), // قيمة افتراضية للعرض
  }));

  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    newView: 'quantity' | 'value'
  ) => {
    if (newView !== null) {
      setView(newView);
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
        title="إحصائيات الإنتاج"
        action={
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
            dir="ltr"
          >
            <ToggleButton value="quantity">الكمية</ToggleButton>
            <ToggleButton value="value">القيمة</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <CardContent>
        <div className="h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.palette.divider}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={theme.palette.text.secondary}
                    tick={{ fill: theme.palette.text.secondary }}
                  />
                  <YAxis
                    stroke={theme.palette.text.secondary}
                    tick={{ fill: theme.palette.text.secondary }}
                    tickFormatter={(value) =>
                      view === 'value'
                        ? `${value.toLocaleString('ar-EG')} ج.م`
                        : value.toLocaleString('ar-EG')
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                    formatter={(value: number) =>
                      view === 'value'
                        ? `${value.toLocaleString('ar-EG')} ج.م`
                        : value.toLocaleString('ar-EG')
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={view}
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.main}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
} 
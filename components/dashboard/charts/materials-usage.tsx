'use client';

import {
  Card,
  CardContent,
  CardHeader,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

interface MaterialsUsageProps {
  data: {
    type: string;
    _sum: {
      quantity: number;
    };
  }[];
}

interface ChartDataItem {
  name: string;
  value: number;
  percentage?: string;
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

export function MaterialsUsage({ data }: MaterialsUsageProps) {
  const theme = useTheme();

  // تحويل البيانات للرسم البياني
  const chartData: ChartDataItem[] = data.map((item) => ({
    name: materialTypes[item.type as keyof typeof materialTypes] || item.type,
    value: item._sum.quantity,
  }));

  // حساب النسب المئوية
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach((item) => {
    item.percentage = ((item.value / total) * 100).toFixed(1);
  });

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <CardHeader title="استخدام المواد" />
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 100,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
              />
              <XAxis
                type="number"
                stroke={theme.palette.text.secondary}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke={theme.palette.text.secondary}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                }}
                formatter={(value: number, name, props) => [
                  `${value.toLocaleString()} (${props.payload.percentage}%)`,
                  'الكمية',
                ]}
                labelStyle={{ color: theme.palette.text.primary }}
              />
              <Bar
                dataKey="value"
                animationDuration={1000}
                animationBegin={200}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={theme.palette.primary.main}
                    fillOpacity={0.6 + (index * 0.4) / chartData.length}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 
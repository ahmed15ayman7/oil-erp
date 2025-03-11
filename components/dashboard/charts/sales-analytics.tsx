'use client';

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  useTheme,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';

interface SalesAnalyticsProps {
  data: {
    byProduct: {
      productId: string;
      _sum: {
        quantity: number;
        total: number;
      };
    }[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function SalesAnalytics({ data }: SalesAnalyticsProps) {
  const theme = useTheme();

  // تحويل البيانات للرسم البياني
  const chartData = data.byProduct.map((item, index) => ({
    name: `منتج ${index + 1}`,
    value: item._sum.total,
  }));

  const totalSales = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <CardHeader
        title="تحليل المبيعات"
        subheader={`إجمالي المبيعات: ${totalSales.toLocaleString('ar-EG', {
          style: 'currency',
          currency: 'EGP',
        })}`}
      />
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  percent,
                }) => {
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

                  return (
                    <text
                      x={x}
                      y={y}
                      fill={theme.palette.text.primary}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                }}
                formatter={(value: number) =>
                  value.toLocaleString('ar-EG', {
                    style: 'currency',
                    currency: 'EGP',
                  })
                }
              />
              <Legend
                formatter={(value, entry) => (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    {value}
                  </Typography>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 
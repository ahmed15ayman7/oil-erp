import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Skeleton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

interface TransactionChartProps {
  title: string;
  type: string;
  color: string;
}

export function TransactionChart({ title, type, color }: TransactionChartProps) {
  const [timeRange, setTimeRange] = useState('day');

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['transaction-stats', type, timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/treasury/stats?type=${type}&timeRange=${timeRange}`
      );
      if (!response.ok) {
        throw new Error('حدث خطأ أثناء جلب البيانات');
      }
      return response.json();
    },
  });

  const formatXAxis = (value: string) => {
    switch (timeRange) {
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

  const formatYAxis = (value: number) => {
    return value.toLocaleString('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>الفترة الزمنية</InputLabel>
            <Select disabled>
              <MenuItem value="day">يوم</MenuItem>
            </Select>
          </FormControl>
          <Skeleton variant="rectangular" height={300} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>الفترة الزمنية</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="الفترة الزمنية"
          >
            <MenuItem value="day">يوم</MenuItem>
            <MenuItem value="week">أسبوع</MenuItem>
            <MenuItem value="month">شهر</MenuItem>
            <MenuItem value="year">سنة</MenuItem>
          </Select>
        </FormControl>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData?.data || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
              />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip
                labelFormatter={(value) => formatXAxis(value)}
                formatter={(value: number) => [
                  formatYAxis(value),
                  title
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                name={title}
                stroke={color}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 
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
  Skeleton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);
interface ProductionChartProps {
  assets: any[];
}

export function ProductionChart({ assets }: ProductionChartProps) {
  const api = useApi();
  const [timeRange, setTimeRange] = useState('day');

  const { data: productionData, isLoading } = useQuery({
    queryKey: ['production-stats', timeRange],
    queryFn: () => api.get(`/api/assets/production-stats?timeRange=${timeRange}`),
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

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>الفترة الزمنية</InputLabel>
            <Select disabled>
              <MenuItem value="day">يوم</MenuItem>
            </Select>
          </FormControl>
          <Skeleton variant="rectangular" height={400} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
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

        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={productionData?.data || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => formatXAxis(value)}
                formatter={(value: number, name: string) => [
                  `${value} وحدة`,
                  assets.find(a => a.id === name)?.name || name
                ]}
              />
              <Legend
                formatter={(value) => assets.find(a => a.id === value)?.name || value}
              />
              {assets.map((asset) => (
                <Line
                  key={asset.id}
                  type="monotone"
                  dataKey={asset.id}
                  name={asset.name}
                  stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 
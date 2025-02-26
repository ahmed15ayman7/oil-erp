'use client';

import { useQuery } from '@tanstack/react-query';
import { Grid } from '@mui/material';
import { Loading } from '@/components/loading';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import {
  IconBox,
  IconTruck,
  IconCoin,
  IconReportMoney,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/use-api';

export default function DashboardPage() {
  const api = useApi();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.get('/api/dashboard/stats'),
  });

  if (isLoading) {
    return <Loading />;
  }

  const statCards = [
    {
      title: 'المخزون',
      value: stats?.inventory.toLocaleString() || '0',
      icon: <IconBox className="w-8 h-8" />,
      color: 'primary.main',
    },
    {
      title: 'المركبات النشطة',
      value: stats?.activeVehicles.toLocaleString() || '0',
      icon: <IconTruck className="w-8 h-8" />,
      color: 'success.main',
    },
    {
      title: 'المبيعات اليوم',
      value: stats?.todaySales.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }) || '0',
      icon: <IconCoin className="w-8 h-8" />,
      color: 'info.main',
    },
    {
      title: 'رصيد الخزنة',
      value: stats?.treasury.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }) || '0',
      icon: <IconReportMoney className="w-8 h-8" />,
      color: 'warning.main',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="لوحة التحكم" />

      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <StatsCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Add more dashboard sections here */}
    </div>
  );
}

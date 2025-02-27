"use client";

import { useQuery } from "@tanstack/react-query";
import { Grid } from "@mui/material";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { StatsCard } from "@/components/stats-card";
import {
  IconBox,
  IconTruck,
  IconCoin,
  IconReportMoney,
} from "@tabler/icons-react";
import { useApi } from "@/hooks/use-api";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { CategoriesManagement } from "@/components/dashboard/categories-management";
import { UnitsManagement } from "@/components/dashboard/units-management";

export default function DashboardPage() {
  const api = useApi();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => api.get("/api/dashboard/stats"),
  });
  const { data: stats2, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard/stats2").then((res) => res.json()),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: () => fetch("/api/dashboard/sales").then((res) => res.json()),
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories"],
    
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });

  const {
    data: units,
    isLoading: unitsLoading,
    refetch: refetchUnits,
  } = useQuery({
    queryKey: ["units"],
    queryFn: () => fetch("/api/units").then((res) => res.json()),
  });

  if (statsLoading || salesLoading || categoriesLoading || unitsLoading) {
    return <Loading />;
  }

  if (isLoading) {
    return <Loading />;
  }

  const statCards = [
    {
      title: "المخزون",
      value: stats?.inventory.toLocaleString() || "0",
      icon: <IconBox className="w-8 h-8" />,
      color: "primary.main",
    },
    {
      title: "المركبات النشطة",
      value: stats?.activeVehicles.toLocaleString() || "0",
      icon: <IconTruck className="w-8 h-8" />,
      color: "success.main",
    },
    {
      title: "المبيعات اليوم",
      value:
        stats?.todaySales.toLocaleString("ar-EG", {
          style: "currency",
          currency: "EGP",
        }) || "0",
      icon: <IconCoin className="w-8 h-8" />,
      color: "info.main",
    },
    {
      title: "رصيد الخزنة",
      value:
        stats?.treasury.toLocaleString("ar-EG", {
          style: "currency",
          currency: "EGP",
        }) || "0",
      icon: <IconReportMoney className="w-8 h-8" />,
      color: "warning.main",
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

      <StatsCards stats={stats2} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SalesChart data={salesData} />
        </Grid>
        <Grid item xs={12} md={4}>
          <div className="space-y-3">
            <CategoriesManagement
              categories={categories}
              onUpdate={refetchCategories}
            />
            <UnitsManagement units={units} onUpdate={refetchUnits} />
          </div>
        </Grid>
      </Grid>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Grid } from "@mui/material";
import {
  IconBox,
  IconTruck,
  IconCoin,
} from "@tabler/icons-react";
import { StatsCard } from "@/components/stats-card";

interface DashboardStatsProps {
  stats: {
    inventory: {
      total: number;
      lowStock: number;
    };
    vehicles: {
      active: number;
      pendingDeliveries: number;
    };
    sales: {
      today: number;
      weekly: any[];
      byProduct: any[];
    };
    treasury: number;
    counts: {
      customers: number;
      suppliers: number;
      products: number;
      activeDrivers: number;
    };
  };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "المخزون",
      value: stats.inventory.total.toLocaleString(),
      subValue: `${stats.inventory.lowStock} منتج منخفض`,
      icon: <IconBox className="w-8 h-8" />,
      color: "primary.main",
      trend: stats.inventory.lowStock > 5 ? ("down" as const) : ("up" as const),
    },
    {
      title: "المركبات النشطة",
      value: stats.vehicles.active.toLocaleString(),
      subValue: `${stats.vehicles.pendingDeliveries} توصيلة معلقة`,
      icon: <IconTruck className="w-8 h-8" />,
      color: "success.main",
      trend: "up" as const,
    },
    {
      title: "المبيعات اليوم",
      value: stats.sales.today.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }),
      subValue: "مقارنة بالأمس",
      icon: <IconCoin className="w-8 h-8" />,
      color: "info.main",
      trend: "up" as const,
    },

  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mb-6"
    >
      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={4} key={card.title}>
            <motion.div variants={item}>
              <StatsCard {...card} />
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
} 
 "use client";

import { Card, CardContent, Typography, Grid } from "@mui/material";
import {
  IconUsers,
  IconTruck,
  IconPackage,
  IconCash,
} from "@tabler/icons-react";

interface StatsCardsProps {
  stats: {
    customers: number;
    suppliers: number;
    products: number;
    sales: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "العملاء",
      value: stats.customers,
      icon: <IconUsers size={24} />,
      color: "primary.main",
    },
    {
      title: "الموردين",
      value: stats.suppliers,
      icon: <IconTruck size={24} />,
      color: "success.main",
    },
    {
      title: "المنتجات",
      value: stats.products,
      icon: <IconPackage size={24} />,
      color: "warning.main",
    },
    {
      title: "المبيعات اليوم",
      value: stats.sales.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }),
      icon: <IconCash size={24} />,
      color: "error.main",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={3} key={card.title}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <div style={{ color: card.color }}>{card.icon}</div>
              <Typography variant="h4" component="div" sx={{ my: 1 }}>
                {card.value}
              </Typography>
              <Typography color="text.secondary">{card.title}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
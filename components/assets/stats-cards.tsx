import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
} from "@mui/material";
import {
  IconBoxSeam,
  IconTools,
  IconAlertTriangle,
  IconCurrencyDollar,
} from "@tabler/icons-react";

interface StatsCardsProps {
  stats: {
    total: number;
    active: number;
    maintenance: number;
    inactive: number;
    totalValue: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "إجمالي الأصول",
      value: stats.total,
      icon: IconBoxSeam,
      color: "#1976d2",
    },
    {
      title: "الأصول النشطة",
      value: stats.active,
      icon: IconTools,
      color: "#2e7d32",
    },
    {
      title: "في الصيانة",
      value: stats.maintenance,
      icon: IconAlertTriangle,
      color: "#ed6c02",
    },
    {
      title: "غير نشط",
      value: stats.inactive,
      icon: IconAlertTriangle,
      color: "#d32f2f",
    },
    {
      title: "القيمة الإجمالية",
      value: stats.totalValue.toLocaleString("ar-EG", {
        style: "currency",
        currency: "EGP",
      }),
      icon: IconCurrencyDollar,
      color: "#9c27b0",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={2.4} key={card.title}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontSize: "1rem" }}
                >
                  {card.title}
                </Typography>
                <card.icon
                  size={24}
                  style={{ color: card.color }}
                />
              </Box>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  color: card.color,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
} 
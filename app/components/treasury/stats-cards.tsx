import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import { IconCash, IconCalendar, IconWallet } from "@tabler/icons-react";

interface StatsCardsProps {
  stats: {
    today: number;
    month: number;
    total: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "إجمالي اليوم",
      value: stats.today,
      icon: IconCalendar,
      color: "#4caf50",
    },
    {
      title: "إجمالي الشهر",
      value: stats.month,
      icon: IconCash,
      color: "#2196f3",
    },
    {
      title: "إجمالي الخزينة",
      value: stats.total,
      icon: IconWallet,
      color: "#9c27b0",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={4} key={card.title}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: `${card.color}20`,
                    color: card.color,
                  }}
                >
                  <card.icon size={24} />
                </Box>
                <Typography variant="h6" component="div">
                  {card.title}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ textAlign: "left" }}>
                {card.value.toLocaleString("ar-EG", {
                  style: "currency",
                  currency: "EGP",
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
} 
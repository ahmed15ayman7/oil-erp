import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
} from "@mui/material";
import {
  IconUsers,
  IconUserCheck,
  IconUserPause,
  IconUserOff,
} from "@tabler/icons-react";

interface StatsCardsProps {
  stats: {
    total: number;
    active: number;
    onLeave: number;
    inactive: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "إجمالي المندوبين",
      value: stats.total,
      icon: <IconUsers size={24} />,
      color: "primary.main",
    },
    {
      title: "المندوبين النشطين",
      value: stats.active,
      icon: <IconUserCheck size={24} />,
      color: "success.main",
    },
    {
      title: "في إجازة",
      value: stats.onLeave,
      icon: <IconUserPause size={24} />,
      color: "warning.main",
    },
    {
      title: "غير نشط",
      value: stats.inactive,
      icon: <IconUserOff size={24} />,
      color: "error.main",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={3} key={card.title}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "5px",
                height: "100%",
                bgcolor: card.color,
              },
            }}
          >
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
                  sx={{ color: "text.secondary", fontSize: "0.875rem" }}
                >
                  {card.title}
                </Typography>
                <Box sx={{ color: card.color }}>{card.icon}</Box>
              </Box>
              <Typography variant="h4" component="div">
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
} 
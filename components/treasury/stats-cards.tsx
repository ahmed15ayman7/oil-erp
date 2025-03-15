import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import {
  IconCash,
  IconCashOff,
  IconWallet,
  IconArrowUpRight,
  IconArrowDownRight,
} from '@tabler/icons-react';

interface StatsCardsProps {
  stats: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    incomeChange: number;
    expenseChange: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'إجمالي الإيرادات',
      value: stats.totalIncome.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }),
      icon: IconCash,
      color: '#4caf50',
      change: stats.incomeChange,
    },
    {
      title: 'إجمالي المصروفات',
      value: stats.totalExpenses.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }),
      icon: IconCashOff,
      color: '#f44336',
      change: stats.expenseChange,
    },
    {
      title: 'الرصيد الحالي',
      value: stats.balance.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }),
      icon: IconWallet,
      color: '#2196f3',
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card, index) => (
        <Grid item xs={12} md={4} key={index}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: 'text.secondary', mb: 1 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {card.value}
                  </Typography>
                  {typeof card.change === 'number' && (
                    <Typography
                      variant="body2"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: card.change >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {card.change >= 0 ? (
                        <IconArrowUpRight size={16} />
                      ) : (
                        <IconArrowDownRight size={16} />
                      )}
                      {Math.abs(card.change)}% مقارنة بالشهر السابق
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: `${card.color}22`,
                  }}
                >
                  <card.icon size={24} color={card.color} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
} 
'use client';

import { Paper, Typography, Box } from '@mui/material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  color = 'primary.main',
}: StatsCardProps) {
  return (
    <Paper
      className="p-4 h-full"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 140,
        justifyContent: 'space-between',
      }}
    >
      <Box className="flex justify-between items-start">
        <Typography
          variant="h6"
          color="text.secondary"
          className="mb-2"
        >
          {title}
        </Typography>
        <Box sx={{ color }}>{icon}</Box>
      </Box>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </Paper>
  );
}

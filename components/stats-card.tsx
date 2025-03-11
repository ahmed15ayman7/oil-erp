'use client';

import { Paper, Typography, Box } from '@mui/material';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down';
}

export function StatsCard({
  title,
  value,
  subValue,
  icon,
  color = 'primary.main',
  trend,
}: StatsCardProps) {
  return (
    <Paper
      component={motion.div}
      whileHover={{ scale: 1.02 }}
      className="p-4 h-full relative overflow-hidden"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 140,
        justifyContent: 'space-between',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        borderRadius: 2,
        boxShadow: (theme) =>
          `0 0 2px 0 ${theme.palette.divider}, 0 4px 8px -2px ${theme.palette.action.focus}`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100%',
          height: '100%',
          opacity: 0.1,
          background: `linear-gradient(45deg, transparent 0%, ${color} 100%)`,
        }}
      />

      <Box className="flex justify-between items-start relative">
        <Typography
          variant="subtitle2"
          color="text.secondary"
          className="mb-1 font-medium"
        >
          {title}
        </Typography>
        <Box sx={{ color }}>{icon}</Box>
      </Box>

      <Box className="relative">
        <Typography variant="h4" component="div" className="mb-1 font-bold">
          {value}
        </Typography>
        
        {subValue && (
          <Box className="flex items-center gap-1">
            {trend && (
              <Box
                component={motion.div}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                sx={{ color: trend === 'up' ? 'success.main' : 'error.main' }}
              >
                {trend === 'up' ? (
                  <IconArrowUpRight size={16} />
                ) : (
                  <IconArrowDownRight size={16} />
                )}
              </Box>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              className="font-medium"
            >
              {subValue}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'جاري التحميل...' }: LoadingProps) {
  return (
    <Box className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <CircularProgress />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}

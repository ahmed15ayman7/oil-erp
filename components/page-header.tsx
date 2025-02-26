'use client';

import { Box, Typography, Button } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';

interface PageHeaderProps {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  onAdd,
  addLabel = 'إضافة',
  actions,
}: PageHeaderProps) {
  return (
    <Box className="flex justify-between items-center mb-6">
      <Typography variant="h4">{title}</Typography>
      <Box className="flex gap-2">
        {actions}
        {onAdd && (
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={onAdd}
            className="bg-primary hover:bg-primary/90"
          >
            {addLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  IconTruck,
  IconPackageExport,
  IconRoute,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface DeliveryStatusProps {
  vehicles: {
    active: number;
    pendingDeliveries: number;
  };
  deliveries: {
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    count: number;
  }[];
}

const statusColors = {
  PENDING: 'warning.main',
  IN_PROGRESS: 'info.main',
  COMPLETED: 'success.main',
  CANCELLED: 'error.main',
};

const statusLabels = {
  PENDING: 'قيد الانتظار',
  IN_PROGRESS: 'جاري التوصيل',
  COMPLETED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

export function DeliveryStatus({ vehicles, deliveries }: DeliveryStatusProps) {
  const totalDeliveries = deliveries?.reduce((sum, item) => sum + item.count, 0) || 0;

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <CardHeader
        title="حالة التوصيل"
        subheader={`${vehicles.active} مركبة نشطة | ${vehicles.pendingDeliveries} توصيلة معلقة`}
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* إحصائيات المركبات */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Box className="flex items-center gap-2">
                <IconTruck className="w-6 h-6" />
                <Typography variant="h6">المركبات النشطة</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {vehicles.active}
              </Typography>
              <Box className="flex items-center gap-2">
                <IconAlertTriangle
                  className="w-5 h-5"
                  style={{ color: vehicles.pendingDeliveries > 5 ? '#f44336' : '#4caf50' }}
                />
                <Typography variant="body2" color="text.secondary">
                  {vehicles.pendingDeliveries > 5
                    ? 'يوجد توصيلات معلقة كثيرة'
                    : 'معدل التوصيل جيد'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* حالة التوصيلات */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.default',
                height: '100%',
              }}
            >
              <Typography variant="h6" className="mb-4">
                حالة التوصيلات
              </Typography>
              <Grid container spacing={2}>
                {deliveries?.map((delivery) => (
                  <Grid item xs={6} sm={3} key={delivery.status}>
                    <Box
                      component={motion.div}
                      whileHover={{ scale: 1.05 }}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        textAlign: 'center',
                      }}
                    >
                      <Chip
                        label={statusLabels[delivery.status]}
                        sx={{
                          mb: 1,
                          bgcolor: statusColors[delivery.status],
                          color: 'white',
                        }}
                        size="small"
                      />
                      <Typography variant="h4">
                        {delivery.count}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="p"
                      >
                        {((delivery.count / totalDeliveries) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
} 
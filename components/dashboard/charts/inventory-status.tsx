'use client';

import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Typography,
  Box,
} from '@mui/material';
import { motion } from 'framer-motion';

interface InventoryStatusProps {
  data: {
    total: number;
    lowStock: number;
    lowStockProducts: {
      id: string;
      name: string;
      quantity: number;
      minQuantity: number;
    }[];
  };
}

export function InventoryStatus({ data }: InventoryStatusProps) {
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <CardHeader
        title="حالة المخزون"
        subheader={`${data.lowStock} منتج تحت الحد الأدنى`}
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>المنتج</TableCell>
                <TableCell align="center">الكمية الحالية</TableCell>
                <TableCell align="center">الحد الأدنى</TableCell>
                <TableCell align="right">النسبة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.lowStockProducts.map((product) => {
                const percentage =
                  (product.quantity / product.minQuantity) * 100;
                return (
                  <TableRow
                    key={product.id}
                    component={motion.tr}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <TableCell>{product.name}</TableCell>
                    <TableCell align="center">
                      {product.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      {product.minQuantity.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            flexGrow: 1,
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: (theme) =>
                              theme.palette.action.hover,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: (theme) =>
                                percentage < 50
                                  ? theme.palette.error.main
                                  : percentage < 75
                                  ? theme.palette.warning.main
                                  : theme.palette.success.main,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ minWidth: 35 }}
                        >
                          {percentage.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
} 
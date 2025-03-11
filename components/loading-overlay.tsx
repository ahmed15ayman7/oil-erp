'use client';

import { motion } from 'framer-motion';
import { Box, useTheme } from '@mui/material';

export function LoadingOverlay() {
  const theme = useTheme();

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full space-y-4"
    >
      {/* محاكاة بطاقات الإحصائيات */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="h-[140px] rounded-lg overflow-hidden relative"
            style={{
              background: theme.palette.background.paper,
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                  'linear-gradient(90deg, transparent 100%, rgba(255,255,255,0.1) 150%, transparent 200%)',
                ],
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        ))}
      </Box>

      {/* محاكاة الرسوم البيانية */}
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={`chart-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="h-[300px] rounded-lg overflow-hidden relative"
            style={{
              background: theme.palette.background.paper,
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                  'linear-gradient(90deg, transparent 100%, rgba(255,255,255,0.1) 150%, transparent 200%)',
                ],
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        ))}
      </Box>

      {/* محاكاة الجداول */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="h-[200px] rounded-lg overflow-hidden relative"
        style={{
          background: theme.palette.background.paper,
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              'linear-gradient(90deg, transparent 100%, rgba(255,255,255,0.1) 150%, transparent 200%)',
            ],
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>
    </Box>
  );
} 
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import 'dayjs/locale/ar';
// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
  prepend: true     // This ensures styles are prepended to the <head>, which is better for RTL
});

// Create theme with RTL direction
const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#D4A373',
      light: '#ffffff',
    },
    secondary: {
      main: '#FAEDCD',
    },
  },
  typography: {
    fontFamily: 'var(--font-cairo)',
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ar">
              {children}
            </LocalizationProvider>
          </ThemeProvider>
        </CacheProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

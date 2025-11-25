"use client";

import React, { useMemo, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { makeStore } from '@/lib/store';
import { AuthProvider } from '@/features/auth/contexts/AuthContext';

export function Providers({ children }: PropsWithChildren) {
  const store = useMemo(() => makeStore(), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <Provider store={store}>
          {children}
        </Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}



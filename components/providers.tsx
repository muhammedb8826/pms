"use client";

import React, { useMemo, useEffect, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { makeStore } from '@/lib/store';
import { AuthProvider } from '@/features/auth/contexts/AuthContext';
import { baseApi } from '@/features/common/api/baseApi';

export function Providers({ children }: PropsWithChildren) {
  const store = useMemo(() => makeStore(), []);

  // Listen for logout events and clear RTK Query cache
  useEffect(() => {
    const handleLogout = () => {
      store.dispatch(baseApi.util.resetApiState());
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [store]);

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



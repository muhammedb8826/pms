"use client";

import React, { useMemo, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/lib/store';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: PropsWithChildren) {
  const store = useMemo(() => makeStore(), []);

  return (
    <AuthProvider>
      <Provider store={store}>
        {children}
      </Provider>
    </AuthProvider>
  );
}



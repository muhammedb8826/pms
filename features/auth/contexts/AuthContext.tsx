'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, AuthTokens } from '@/features/auth/types';
import { authService } from '@/services/auth';

type AuthContextType = {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; confirm_password: string; phone: string; address: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTokens = typeof window !== 'undefined' ? localStorage.getItem('tokens') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedTokens && storedUser) {
      try {
        setTokens(JSON.parse(storedTokens));
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const persistUser = (next: User | null) => {
    if (typeof window !== 'undefined') {
      if (next) {
        localStorage.setItem('user', JSON.stringify(next));
      } else {
        localStorage.removeItem('user');
      }
    }
    setUser(next);
  };

  const signin = async (email: string, password: string) => {
    const response = await authService.signin({ email, password });
    // Validate response structure
    if (!response || !response.tokens || !response.user) {
      throw new Error('Invalid response from server');
    }
    persistUser(response.user);
    setTokens(response.tokens);
    localStorage.setItem('tokens', JSON.stringify(response.tokens));
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
  };

  const signup = async (data: { email: string; password: string; confirm_password: string; phone: string; address: string }) => {
    const response = await authService.signup(data);
    // Validate response structure
    if (!response || !response.tokens || !response.user) {
      throw new Error('Invalid response from server');
    }
    persistUser(response.user);
    setTokens(response.tokens);
    localStorage.setItem('tokens', JSON.stringify(response.tokens));
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      persistUser(null);
      setTokens(null);
      localStorage.removeItem('tokens');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const refreshTokens = async () => {
    const response = await authService.refreshTokens();
    // Validate response structure
    if (!response || !response.tokens) {
      throw new Error('Invalid response from server');
    }
    setTokens(response.tokens);
    localStorage.setItem('tokens', JSON.stringify(response.tokens));
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
  };

  const updateUserInfo = useCallback((partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, tokens, isLoading, signin, signup, logout, refreshTokens, updateUser: updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

 
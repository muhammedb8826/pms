'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const signin = async (email: string, password: string) => {
    const response = await authService.signin({ email, password });
    setUser(response.user);
    setTokens(response.tokens);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('tokens', JSON.stringify(response.tokens));
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
  };

  const signup = async (data: { email: string; password: string; confirm_password: string; phone: string; address: string }) => {
    const response = await authService.signup(data);
    setUser(response.user);
    setTokens(response.tokens);
    localStorage.setItem('user', JSON.stringify(response.user));
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
      setUser(null);
      setTokens(null);
      localStorage.removeItem('user');
      localStorage.removeItem('tokens');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const refreshTokens = async () => {
    const response = await authService.refreshTokens();
    setTokens(response.tokens);
    localStorage.setItem('tokens', JSON.stringify(response.tokens));
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
  };

  return (
    <AuthContext.Provider value={{ user, tokens, isLoading, signin, signup, logout, refreshTokens }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

 
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthTokens } from '@/types/auth';
import { authService } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

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

  const signup = async (data: any) => {
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
      // ignore logout errors
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
    <AuthContext.Provider value={{
      user,
      tokens,
      isLoading,
      signin,
      signup,
      logout,
      refreshTokens,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



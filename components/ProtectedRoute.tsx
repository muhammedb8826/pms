'use client';

import React from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { AuthRole } from '@/features/auth/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AuthRole[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const userRoles = React.useMemo(() => {
    if (!user || !user.role) return [];
    // Backend returns single role, convert to array for compatibility
    return [user.role];
  }, [user]);

  React.useEffect(() => {
    if (!isLoading && !user) {
      // Store the current path for redirect after login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        // Only store if it's not already the login page
        if (!currentPath.startsWith('/login')) {
          localStorage.setItem('login_redirect', currentPath);
        }
      }
      router.push('/login');
    }
    if (user && requiredRoles && requiredRoles.length > 0) {
      const hasAccess = requiredRoles.some((role) => userRoles.includes(role));
      if (!hasAccess) {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, requiredRoles, userRoles, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasAccess) {
      return <div>Unauthorized</div>;
    }
  }

  return <>{children}</>;
}



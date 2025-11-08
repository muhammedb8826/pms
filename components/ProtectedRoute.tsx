'use client';

import React from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const userRoles = React.useMemo(() => {
    if (!user) return [];
    const roles = user.roles;
    if (Array.isArray(roles)) return roles;
    if (typeof roles === 'string' && roles.length > 0) {
      return roles.split(',').map((role) => role.trim()).filter(Boolean);
    }
    return [];
  }, [user]);

  React.useEffect(() => {
    if (!isLoading && !user) {
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



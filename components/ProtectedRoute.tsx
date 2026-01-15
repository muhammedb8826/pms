'use client';

import React from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { AuthRole } from '@/features/auth/types';
import { useHasPermission } from '@/hooks/useHasPermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AuthRole[];
  requiredPermission?: string | string[];
  requireAllPermissions?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles,
  requiredPermission,
  requireAllPermissions = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const hasPermission = useHasPermission(requiredPermission || [], requireAllPermissions);
  
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
      return;
    }
    
    if (user) {
      // Check role-based access
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRoleAccess = requiredRoles.some((role) => userRoles.includes(role));
        if (!hasRoleAccess) {
          router.push('/unauthorized');
          return;
        }
      }
      
      // Check permission-based access (admins bypass permission checks)
      if (requiredPermission && user.role !== 'ADMIN') {
        if (!hasPermission) {
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [user, isLoading, requiredRoles, userRoles, requiredPermission, hasPermission, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRoleAccess = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRoleAccess) {
      return <div>Unauthorized</div>;
    }
  }

  // Check permission-based access (admins bypass permission checks)
  if (requiredPermission && user.role !== 'ADMIN') {
    if (!hasPermission) {
      return <div>Unauthorized</div>;
    }
  }

  return <>{children}</>;
}



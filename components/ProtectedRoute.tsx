'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (user && requiredRoles && !requiredRoles.includes(user.roles)) {
      router.push('/unauthorized');
    }
  }, [user, isLoading, requiredRoles, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (requiredRoles && !requiredRoles.includes(user.roles)) {
    return <div>Unauthorized</div>;
  }

  return <>{children}</>;
}



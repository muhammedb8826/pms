'use client';

import { ReactNode } from 'react';
import { useHasPermission } from '@/hooks/useHasPermission';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 * If user doesn't have the required permission, renders fallback or nothing
 */
export function PermissionGuard({
  children,
  requiredPermission,
  requireAll = false,
  fallback = null,
  showError = false,
}: PermissionGuardProps) {
  const hasPermission = useHasPermission(requiredPermission, requireAll);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (showError) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        You don&apos;t have permission to access this content.
      </div>
    );
  }

  return <>{fallback}</>;
}

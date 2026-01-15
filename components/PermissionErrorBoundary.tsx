'use client';

import { ReactNode } from 'react';
import { useHasPermission } from '@/hooks/useHasPermission';


interface PermissionErrorBoundaryProps {
  children: ReactNode;
  requiredPermission: string | string[];
  fallback?: ReactNode;
  showEmptyState?: boolean;
}

/**
 * Component that shows an empty state or fallback when user lacks permission
 * Use this to wrap content that requires specific permissions
 */
export function PermissionErrorBoundary({
  children,
  requiredPermission,
  fallback,
  showEmptyState = true,
}: PermissionErrorBoundaryProps) {
  const hasPermission = useHasPermission(requiredPermission);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-muted-foreground">
          <p className="text-sm font-medium">Access Restricted</p>
          <p className="mt-1 text-xs">
            You don&apos;t have permission to view this content.
          </p>
          <p className="mt-1 text-xs">
            Please contact your administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

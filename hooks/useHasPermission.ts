import { useMemo } from 'react';
import { useCurrentUserPermissions } from '@/features/permission/hooks/usePermissions';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { canPerformAction } from '@/lib/utils/permissions';

/**
 * Hook to check if the current user has a specific permission
 * @param requiredPermission - Single permission code or array of permission codes
 * @param requireAll - If true, user must have ALL permissions. If false, user needs ANY permission
 * @returns boolean indicating if user has the permission(s)
 */
export function useHasPermission(
  requiredPermission: string | string[],
  requireAll: boolean = false
): boolean {
  const { user } = useAuth();
  const { codes: permissions } = useCurrentUserPermissions();

  return useMemo(() => {
    // Admins bypass all permission checks
    if (user?.role === 'ADMIN') {
      return true;
    }

    if (!permissions || permissions.length === 0) {
      return false;
    }

    const requiredList = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    if (requireAll) {
      // User must have ALL permissions
      return requiredList.every((code) => permissions.includes(code));
    } else {
      // User needs ANY permission
      return requiredList.some((code) => permissions.includes(code));
    }
  }, [user?.role, permissions, requiredPermission, requireAll]);
}

/**
 * Hook to check if the current user has any of the specified permissions
 */
export function useHasAnyPermission(requiredPermission: string | string[]): boolean {
  return useHasPermission(requiredPermission, false);
}

/**
 * Hook to check if the current user has all of the specified permissions
 */
export function useHasAllPermissions(requiredPermission: string | string[]): boolean {
  return useHasPermission(requiredPermission, true);
}

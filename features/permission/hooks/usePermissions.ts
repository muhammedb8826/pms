"use client";

import { useMemo } from 'react';
import {
  useGetPermissionsQuery,
  useGetCurrentUserPermissionsQuery,
  useGetUserPermissionsQuery,
  useSetUserPermissionsMutation,
} from '@/features/permission/api/permissionApi';
import type { Permission } from '@/features/permission/types';
import { useAuth } from '@/features/auth/contexts/AuthContext';

export function usePermissions() {
  const query = useGetPermissionsQuery();
  const permissions = (query.data as Permission[] | undefined) ?? [];
  return { ...query, permissions };
}

export function useUserPermissions(userId?: string) {
  const query = useGetUserPermissionsQuery(userId ?? '', {
    skip: !userId,
  });
  const codes = (query.data as string[] | undefined) ?? [];
  return { ...query, codes };
}

export function useSetUserPermissions() {
  const [mutate, result] = useSetUserPermissionsMutation();
  return {
    mutateAsync: (userId: string, codes: string[]) => mutate({ userId, codes }),
    ...result,
  };
}

// Convenience hook for the currently logged-in user
// Uses GET /api/permissions/me (recommended endpoint for current user)
export function useCurrentUserPermissions() {
  const { user, isLoading: authLoading } = useAuth();
  const query = useGetCurrentUserPermissionsQuery(undefined, {
    skip: !user, // Skip if not authenticated
  });

  // Handle both wrapped and unwrapped responses
  const codes = useMemo(() => {
    const data = query.data;
    if (!data) return [];
    
    // If it's already an array, return it
    if (Array.isArray(data)) {
      return data;
    }
    
    // If it's a wrapped response with data field
    if (typeof data === 'object' && data !== null && 'data' in data) {
      const wrapped = data as { data?: unknown };
      if (Array.isArray(wrapped.data)) {
        return wrapped.data as string[];
      }
    }
    
    return [];
  }, [query.data]);

  return {
    ...query,
    codes,
    userId: user?.id,
    isLoading: authLoading || query.isLoading,
    isLoaded: !authLoading && !query.isLoading && !query.isFetching,
  };
}



"use client";

import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetAllUsersQuery,
  useGetUserQuery,
  useGetUsersByRoleQuery,
  useGetUsersQuery,
  useUpdateUserMutation,
} from '@/features/user/api/userApi';
import type { PaginatedUsers, UpdateUserInput, User, UserFilters, UserRole } from '@/features/user/types';

type WrappedResponse<T> = { success?: boolean; data?: T };

function unwrapData<T>(response: T | WrappedResponse<T> | undefined): T | undefined {
  if (!response) return undefined;
  if (typeof response === 'object' && response !== null && 'success' in response) {
    const wrapped = response as WrappedResponse<T>;
    if (wrapped.success && wrapped.data) {
      return wrapped.data;
    }
    return wrapped.data;
  }
  return response as T;
}

export function useUsers(page = 1, limit = 10, filters?: Omit<UserFilters, 'page' | 'limit'>) {
  const queryFilters: UserFilters = {
    page,
    limit,
    ...filters,
  };

  const query = useGetUsersQuery(queryFilters);

  // Backend may return either:
  // - PaginatedUsers
  // - WrappedResponse<PaginatedUsers>
  // - User[]
  // - WrappedResponse<User[]>
  const unwrapped = unwrapData<PaginatedUsers | User[]>(
    query.data as PaginatedUsers | User[] | WrappedResponse<PaginatedUsers | User[]> | undefined,
  );

  let normalized: PaginatedUsers | undefined;
  if (unwrapped) {
    if (Array.isArray(unwrapped)) {
      normalized = {
        users: unwrapped,
        total: unwrapped.length,
        page,
        limit,
      };
    } else if ('users' in unwrapped) {
      normalized = unwrapped;
    }
  }

  // Normalize role/roles mismatch between backend and frontend types
  const normalizedUsers: User[] = (normalized?.users ?? []).map((u) => {
    const anyUser = u as unknown as User & { role?: UserRole; gender?: string | null };
    const rolesArray =
      Array.isArray(anyUser.roles) && anyUser.roles.length > 0
        ? anyUser.roles
        : anyUser.role
          ? [anyUser.role]
          : [];

    // Normalize gender casing to match UserGender union
    const gender =
      anyUser.gender && typeof anyUser.gender === 'string'
        ? (anyUser.gender.toUpperCase() as User['gender'])
        : anyUser.gender;

    return {
      ...anyUser,
      roles: rolesArray,
      gender,
    };
  });

  return {
    users: normalizedUsers,
    total: normalized?.total ?? 0,
    page: normalized?.page ?? page,
    limit: normalized?.limit ?? limit,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error:
      query.error && typeof query.error === 'object' && query.error !== null && 'status' in query.error
        ? (query.error as { status?: number; data?: { message?: string } }).data?.message || 'Failed to load users'
        : null,
    refetch: query.refetch,
  };
}

export function useAllUsers() {
  const query = useGetAllUsersQuery();
  const data = unwrapData<User[]>(query.data as User[] | WrappedResponse<User[]> | undefined);
  return {
    ...query,
    data: data ?? [],
  };
}

export function useUsersByRole(role?: UserRole) {
  const query = useGetUsersByRoleQuery(role ? { role } : undefined);
  const data = unwrapData<User[]>(query.data as User[] | WrappedResponse<User[]> | undefined);
  return {
    ...query,
    data: data ?? [],
  };
}

export function useUser(id: string | null | undefined) {
  const query = useGetUserQuery(id ?? '', { skip: !id });
  const raw = unwrapData<User>(query.data as User | WrappedResponse<User> | undefined);

  // Normalize single role → roles array for consistency with User type
  let data: User | undefined;
  if (raw) {
    const anyUser = raw as unknown as User & { role?: UserRole; gender?: string | null };
    const rolesArray =
      Array.isArray(anyUser.roles) && anyUser.roles.length > 0
        ? anyUser.roles
        : anyUser.role
          ? [anyUser.role]
          : [];
    const gender =
      anyUser.gender && typeof anyUser.gender === 'string'
        ? (anyUser.gender.toUpperCase() as User['gender'])
        : anyUser.gender;

    data = { ...anyUser, roles: rolesArray, gender };
  }
  return {
    ...query,
    data: data ?? undefined,
  };
}

export function useCreateUser() {
  const [mutate, result] = useCreateUserMutation();
  return {
    mutateAsync: (data: Parameters<typeof mutate>[0]) => mutate(data).unwrap(),
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateUser() {
  const [mutate, result] = useUpdateUserMutation();
  return {
    mutateAsync: (args: { id: string; data: UpdateUserInput | FormData }) => mutate(args).unwrap(),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteUser() {
  const [mutate, result] = useDeleteUserMutation();
  return {
    mutateAsync: (id: string) => mutate(id).unwrap(),
    isPending: result.isLoading,
    ...result,
  };
}



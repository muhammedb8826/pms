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
import type {
  CreateUserInput,
  PaginatedUsers,
  UpdateUserInput,
  User,
  UserFilters,
  UserRole,
} from '@/features/user/types';

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
  const rawData = unwrapData<PaginatedUsers>(query.data as PaginatedUsers | WrappedResponse<PaginatedUsers> | undefined);

  return {
    users: rawData?.users ?? [],
    total: rawData?.total ?? 0,
    page: rawData?.page ?? page,
    limit: rawData?.limit ?? limit,
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
  const data = unwrapData<User>(query.data as User | WrappedResponse<User> | undefined);
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



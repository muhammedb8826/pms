"use client";

import { baseApi } from '@/features/common/api/baseApi';
import type {
  CreateUserInput,
  PaginatedUsers,
  UpdateUserInput,
  User,
  UserFilters,
  UserRole,
} from '@/features/user/types';

type WrappedResponse<T> = {
  success?: boolean;
  data?: T;
};

type PaginatedUsersResponse = PaginatedUsers | WrappedResponse<PaginatedUsers>;

const normalizePaginatedUsers = (response?: PaginatedUsersResponse): PaginatedUsers | undefined => {
  if (!response) return undefined;
  if ('success' in response && response.success && response.data) {
    return response.data;
  }
  if ('users' in response) {
    return response;
  }
  return undefined;
};

const paramsFromFilters = (filters?: UserFilters | void) => {
  if (!filters) return undefined;
  const params: Record<string, string | number | boolean> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search) params.search = filters.search;
  if (filters.role && filters.role.length > 0) params.role = filters.role;
  if (typeof filters.isActive === 'boolean') params.isActive = filters.isActive;
  if (filters.gender) params.gender = filters.gender;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;
  return params;
};

type CreateUserRequest = FormData | CreateUserInput;
type UpdateUserRequest = FormData | UpdateUserInput;

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<PaginatedUsersResponse, UserFilters | undefined>({
      query: (filters) => ({
        url: '/users',
        params: paramsFromFilters(filters),
      }),
      providesTags: (result) => {
        const data = normalizePaginatedUsers(result);
        const users = data?.users ?? [];
        return [
          ...users.map((user) => ({ type: 'User' as const, id: user.id })),
          { type: 'Users' as const, id: 'LIST' },
        ];
      },
    }),
    getAllUsers: build.query<User[] | WrappedResponse<User[]>, void>({
      query: () => ({
        url: '/users/all',
      }),
      providesTags: (result) => {
        const list =
          (result && Array.isArray(result) ? result : result && 'data' in result ? result.data : undefined) ?? [];
        return [
          ...list.map((user) => ({ type: 'User' as const, id: user.id })),
          { type: 'Users' as const, id: 'LIST' },
        ];
      },
    }),
    getUsersByRole: build.query<User[] | WrappedResponse<User[]>, { role?: UserRole | string } | void>({
      query: (params) => ({
        url: '/users/by-role',
        params: params && params.role ? { role: params.role } : undefined,
      }),
      providesTags: (result) => {
        const list =
          (result && Array.isArray(result) ? result : result && 'data' in result ? result.data : undefined) ?? [];
        return [
          ...list.map((user) => ({ type: 'User' as const, id: user.id })),
          { type: 'Users' as const, id: 'LIST' },
        ];
      },
    }),
    getUser: build.query<User | WrappedResponse<User>, string>({
      query: (id) => ({
        url: `/users/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'User' as const, id }],
    }),
    createUser: build.mutation<User | WrappedResponse<User>, CreateUserRequest>({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    updateUser: build.mutation<User | WrappedResponse<User>, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'User' as const, id },
        { type: 'Users' as const, id: 'LIST' },
      ],
    }),
    deleteUser: build.mutation<{ success: boolean } | WrappedResponse<{ success: boolean }>, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'User' as const, id },
        { type: 'Users' as const, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetAllUsersQuery,
  useGetUsersByRoleQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;



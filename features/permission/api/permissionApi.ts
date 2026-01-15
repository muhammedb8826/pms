import { baseApi } from '@/features/common/api/baseApi';
import type { Permission, UserPermissionsDto } from '@/features/permission/types';
import { unwrapResponseData } from '@/types/api-response';

export const permissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all available permissions (codes + descriptions)
    getPermissions: builder.query<Permission[], void>({
      query: () => '/permissions',
      transformResponse: (resp: unknown) =>
        unwrapResponseData<Permission[]>(resp) ?? (resp as Permission[]),
      providesTags: ['Permissions'],
    }),

    // Create a new permission code
    createPermission: builder.mutation<Permission, { code: string; description?: string }>({
      query: (data) => ({
        url: '/permissions',
        method: 'POST',
        body: data,
      }),
      transformResponse: (resp: unknown) =>
        unwrapResponseData<Permission>(resp) ?? (resp as Permission),
      invalidatesTags: ['Permissions'],
    }),

    // Delete a permission code
    deletePermission: builder.mutation<void, string>({
      query: (id) => ({
        url: `/permissions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Permissions'],
    }),

    // Get current user's permissions (self)
    // We accept a userId argument purely to scope the RTK Query cache per user,
    // but the backend endpoint always uses /permissions/me and ignores the argument.
    getCurrentUserPermissions: builder.query<string[], string | void>({
      query: () => '/permissions/me',
      transformResponse: (resp: unknown) =>
        unwrapResponseData<string[]>(resp) ?? (resp as string[]),
      providesTags: [{ type: 'UserPermissions' as const, id: 'me' }],
    }),

    // Get permission codes for a specific user (admin only)
    getUserPermissions: builder.query<string[], string>({
      query: (userId) => `/permissions/users/${userId}`,
      transformResponse: (resp: unknown) =>
        unwrapResponseData<string[]>(resp) ?? (resp as string[]),
      providesTags: (result, error, userId) => [
        { type: 'UserPermissions' as const, id: userId },
      ],
    }),

    // Add permissions to a user (merge - adds on top of existing)
    addUserPermissions: builder.mutation<string[], { userId: string; codes: string[] }>({
      query: ({ userId, codes }) => ({
        url: `/permissions/users/${userId}`,
        method: 'POST',
        body: { codes } satisfies UserPermissionsDto,
      }),
      transformResponse: (resp: unknown) =>
        unwrapResponseData<string[]>(resp) ?? (resp as string[]),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserPermissions' as const, id: userId },
        { type: 'UserPermissions' as const, id: 'me' },
      ],
    }),

    // Replace all permissions for a user (set - replaces all existing)
    setUserPermissions: builder.mutation<string[], { userId: string; codes: string[] }>({
      query: ({ userId, codes }) => ({
        url: `/permissions/users/${userId}`,
        method: 'PATCH',
        body: { codes } satisfies UserPermissionsDto,
      }),
      transformResponse: (resp: unknown) =>
        unwrapResponseData<string[]>(resp) ?? (resp as string[]),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserPermissions' as const, id: userId },
        { type: 'UserPermissions' as const, id: 'me' },
      ],
    }),

    // Remove a single permission from a user
    removeUserPermission: builder.mutation<string[], { userId: string; code: string }>({
      query: ({ userId, code }) => ({
        url: `/permissions/users/${userId}/${code}`,
        method: 'DELETE',
      }),
      transformResponse: (resp: unknown) =>
        unwrapResponseData<string[]>(resp) ?? (resp as string[]),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserPermissions' as const, id: userId },
        { type: 'UserPermissions' as const, id: 'me' },
      ],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useDeletePermissionMutation,
  useGetCurrentUserPermissionsQuery,
  useGetUserPermissionsQuery,
  useAddUserPermissionsMutation,
  useSetUserPermissionsMutation,
  useRemoveUserPermissionMutation,
} = permissionApi;



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

    // Replace all permissions for a user
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
      ],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetCurrentUserPermissionsQuery,
  useGetUserPermissionsQuery,
  useSetUserPermissionsMutation,
} = permissionApi;



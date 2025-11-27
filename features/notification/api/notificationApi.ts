import { baseApi } from '@/features/common/api/baseApi';
import type {
  Notification,
  PaginatedNotifications,
  NotificationFilters,
  CreateNotificationDto,
  UpdateNotificationDto,
  MarkAllReadResponse,
  DeleteAllResponse,
} from '@/features/notification/types';

function unwrapResponse<T>(response: { data?: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: T }).data;
    if (data !== undefined) {
      return data;
    }
  }
  return response as T;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedNotifications, NotificationFilters | undefined>({
      query: (params = {}) => {
        const {
          page = 1,
          limit = 20,
          isRead,
          type,
          sortBy = 'createdAt',
          sortOrder = 'DESC',
        } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (isRead !== undefined) query.set('isRead', String(isRead));
        if (type) query.set('type', type);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/notifications?${query.toString()}`;
      },
      transformResponse: unwrapResponse<PaginatedNotifications>,
      providesTags: ['Notifications'],
    }),
    getUnreadCount: builder.query<number, void>({
      query: () => '/notifications/unread-count',
      transformResponse: unwrapResponse<number>,
      providesTags: ['Notifications'],
    }),
    getNotification: builder.query<Notification, string>({
      query: (id) => `/notifications/${id}`,
      transformResponse: unwrapResponse<Notification>,
      providesTags: (result, error, id) => [{ type: 'Notification', id }],
    }),
    createNotification: builder.mutation<Notification, CreateNotificationDto>({
      query: (data) => ({
        url: '/notifications',
        method: 'POST',
        body: data,
      }),
      transformResponse: unwrapResponse<Notification>,
      invalidatesTags: ['Notifications'],
    }),
    updateNotification: builder.mutation<Notification, { id: string; data: UpdateNotificationDto }>({
      query: ({ id, data }) => ({
        url: `/notifications/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: unwrapResponse<Notification>,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Notification', id },
        'Notifications',
      ],
    }),
    markAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      transformResponse: unwrapResponse<Notification>,
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        'Notifications',
      ],
    }),
    markAsUnread: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/unread`,
        method: 'PATCH',
      }),
      transformResponse: unwrapResponse<Notification>,
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        'Notifications',
      ],
    }),
    markAllAsRead: builder.mutation<MarkAllReadResponse, void>({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'PATCH',
      }),
      transformResponse: unwrapResponse<MarkAllReadResponse>,
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      transformResponse: unwrapResponse<void>,
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        'Notifications',
      ],
    }),
    deleteAllRead: builder.mutation<DeleteAllResponse, void>({
      query: () => ({
        url: '/notifications/read/all',
        method: 'DELETE',
      }),
      transformResponse: unwrapResponse<DeleteAllResponse>,
      invalidatesTags: ['Notifications'],
    }),
    deleteAll: builder.mutation<DeleteAllResponse, void>({
      query: () => ({
        url: '/notifications/all',
        method: 'DELETE',
      }),
      transformResponse: unwrapResponse<DeleteAllResponse>,
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useGetNotificationQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllReadMutation,
  useDeleteAllMutation,
} = notificationApi;


import {
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
} from '@/features/notification/api/notificationApi';
import type {
  Notification,
  PaginatedNotifications,
  NotificationFilters,
  CreateNotificationDto,
  UpdateNotificationDto,
} from '@/features/notification/types';

/**
 * Get paginated notifications with filters
 */
type GetNotificationsQueryOptions = Parameters<
  typeof useGetNotificationsQuery
>[1];

export function useNotifications(
  filters?: NotificationFilters,
  options?: GetNotificationsQueryOptions,
) {
  return useGetNotificationsQuery(filters, options);
}

/**
 * Get unread notification count
 */
export function useUnreadCount() {
  return useGetUnreadCountQuery();
}

/**
 * Get single notification by ID
 */
export function useNotification(id: string) {
  return useGetNotificationQuery(id);
}

/**
 * Create a new notification
 */
export function useCreateNotification() {
  const [trigger, result] = useCreateNotificationMutation();
  return {
    mutateAsync: (data: CreateNotificationDto) => trigger(data).unwrap(),
    ...result,
  };
}

/**
 * Update a notification
 */
export function useUpdateNotification() {
  const [trigger, result] = useUpdateNotificationMutation();
  return {
    mutateAsync: (payload: { id: string; data: UpdateNotificationDto }) =>
      trigger(payload).unwrap(),
    ...result,
  };
}

/**
 * Mark notification as read
 */
export function useMarkAsRead() {
  const [trigger, result] = useMarkAsReadMutation();
  return {
    mutateAsync: (id: string) => trigger(id).unwrap(),
    ...result,
  };
}

/**
 * Mark notification as unread
 */
export function useMarkAsUnread() {
  const [trigger, result] = useMarkAsUnreadMutation();
  return {
    mutateAsync: (id: string) => trigger(id).unwrap(),
    ...result,
  };
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
  const [trigger, result] = useMarkAllAsReadMutation();
  return {
    mutateAsync: () => trigger().unwrap(),
    ...result,
  };
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const [trigger, result] = useDeleteNotificationMutation();
  return {
    mutateAsync: (id: string) => trigger(id).unwrap(),
    ...result,
  };
}

/**
 * Delete all read notifications
 */
export function useDeleteAllRead() {
  const [trigger, result] = useDeleteAllReadMutation();
  return {
    mutateAsync: () => trigger().unwrap(),
    ...result,
  };
}

/**
 * Delete all notifications
 */
export function useDeleteAll() {
  const [trigger, result] = useDeleteAllMutation();
  return {
    mutateAsync: () => trigger().unwrap(),
    ...result,
  };
}


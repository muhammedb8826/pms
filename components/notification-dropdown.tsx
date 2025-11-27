"use client";

import React, { useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCheck,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllRead,
} from '@/features/notification/hooks/useNotifications';
import type { PaginatedNotifications } from '@/features/notification/types';
import { NotificationType } from '@/features/notification/types';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import { cn } from '@/lib/utils';
import type { Notification } from '@/features/notification/types';

/**
 * Format a date as relative time (e.g., "2 minutes ago", "3 hours ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

interface NotificationDropdownProps {
  onClose?: () => void;
  data?: PaginatedNotifications;
  loading?: boolean;
  externalRefetch?: () => Promise<unknown>;
}

export function NotificationDropdown({
  onClose,
  data: externalData,
  loading: externalLoading,
  externalRefetch,
}: NotificationDropdownProps) {
  const router = useRouter();
  const useExternalData = externalData !== undefined || externalLoading === true;
  const { data, isLoading, refetch, error } = useNotifications(
    {
      page: 1,
      limit: 10,
      isRead: false,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    },
    { skip: useExternalData },
  );

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();
  const deleteAllReadMutation = useDeleteAllRead();

  const notificationsData = externalData ?? data;
  const notifications = useMemo(
    () => notificationsData?.notifications || [],
    [notificationsData],
  );
  const unreadCount = notificationsData?.unreadCount || 0;
  const loading = useExternalData ? externalLoading ?? false : isLoading;
  const effectiveRefetch = useExternalData
    ? externalRefetch ?? (() => Promise.resolve())
    : refetch;

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (useExternalData) return;
    refetch();
    // Poll every 30 seconds while dropdown might be open
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch, useExternalData]);

  const handleMarkAsRead = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await markAsReadMutation.mutateAsync(id);
        handleApiSuccess('Notification marked as read');
        effectiveRefetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to mark notification as read' });
      }
    },
    [markAsReadMutation, refetch],
  );

  const handleMarkAllAsRead = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await markAllAsReadMutation.mutateAsync();
        handleApiSuccess('All notifications marked as read');
        effectiveRefetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to mark all as read' });
      }
    },
    [markAllAsReadMutation, refetch],
  );

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess('Notification deleted');
        effectiveRefetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to delete notification' });
      }
    },
    [deleteMutation, refetch],
  );

  const handleDeleteAllRead = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteAllReadMutation.mutateAsync();
        handleApiSuccess('All read notifications deleted');
        effectiveRefetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to delete read notifications' });
      }
    },
    [deleteAllReadMutation, refetch],
  );

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      // Mark as read if unread
      if (!notification.isRead) {
        await handleMarkAsRead(notification.id);
      }

      // Navigate to action URL if provided
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
        onClose?.();
      }
    },
    [handleMarkAsRead, router, onClose],
  );

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INFO:
        return 'bg-blue-500';
      case NotificationType.SUCCESS:
        return 'bg-green-500';
      case NotificationType.WARNING:
        return 'bg-orange-500';
      case NotificationType.ERROR:
        return 'bg-red-500';
      case NotificationType.SYSTEM:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!useExternalData && error) {
    return (
      <div className="flex flex-col p-4 text-sm text-destructive">
        Failed to load notifications.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
            >
              <IconCheck className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleDeleteAllRead}
            title="Delete all read"
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs text-muted-foreground mt-1">
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={cn(
                  'relative cursor-pointer p-4 transition-colors hover:bg-muted/50',
                  !notification.isRead && 'bg-muted/30',
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {/* Type indicator */}
                  <div
                    className={cn(
                      'mt-1 size-2 shrink-0 rounded-full',
                      getTypeColor(notification.type),
                    )}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={cn(
                          'text-sm font-medium',
                          !notification.isRead && 'font-semibold',
                        )}
                      >
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            title="Mark as read"
                          >
                            <IconCheck className="size-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={(e) => handleDelete(notification.id, e)}
                          title="Delete"
                        >
                          <IconX className="size-3" />
                        </Button>
                      </div>
                    </div>
                    {notification.message && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(notification.createdAt))}
                      </span>
                      {notification.actionLabel && (
                        <Badge variant="outline" className="text-xs">
                          {notification.actionLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full text-xs"
              onClick={() => router.push('/notifications')}
            >
              View all notifications
            </Button>
          </div>
        </>
      )}
    </div>
  );
}


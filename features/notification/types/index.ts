/**
 * Notification Types
 */

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string | null;
  type: NotificationType;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  title: string;
  message?: string | null;
  type: NotificationType;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateNotificationDto {
  title?: string;
  message?: string | null;
  type?: NotificationType;
  isRead?: boolean;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
  sortBy?: 'createdAt' | 'isRead' | 'type';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface MarkAllReadResponse {
  count: number;
}

export interface DeleteAllResponse {
  count: number;
}


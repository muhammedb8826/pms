"use client";

import React, { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconBell,
  IconDotsVertical,
  IconTrash,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDesc,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardDataTable } from "@/components/dashboard-data-table";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAsUnread,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllRead,
  useDeleteAll,
} from "@/features/notification/hooks/useNotifications";
import type { Notification } from "@/features/notification/types";
import { NotificationType } from "@/features/notification/types";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const typeLabels: Record<NotificationType, string> = {
  [NotificationType.INFO]: "Info",
  [NotificationType.SUCCESS]: "Success",
  [NotificationType.WARNING]: "Warning",
  [NotificationType.ERROR]: "Error",
  [NotificationType.SYSTEM]: "System",
};

const readFilterOptions = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
];

export default function NotificationsPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");

  const { data, isLoading, error, refetch } = useNotifications({
    page: pageIndex + 1,
    limit: pageSize,
    type: typeFilter === "all" ? undefined : typeFilter,
    isRead:
      readFilter === "all" ? undefined : readFilter === "read" ? true : false,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  const notifications = data?.notifications ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const unreadCount = data?.unreadCount ?? 0;

  const markAsReadMutation = useMarkAsRead();
  const markAsUnreadMutation = useMarkAsUnread();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();
  const deleteAllReadMutation = useDeleteAllRead();
  const deleteAllMutation = useDeleteAll();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteReadOpen, setConfirmDeleteReadOpen] = useState(false);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);

  const handleMarkAsRead = useCallback(
    async (notification: Notification) => {
      if (notification.isRead) return;
      try {
        await markAsReadMutation.mutateAsync(notification.id);
        handleApiSuccess("Notification marked as read");
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to mark as read" });
      }
    },
    [markAsReadMutation, refetch],
  );

  const handleMarkAsUnread = useCallback(
    async (notification: Notification) => {
      if (!notification.isRead) return;
      try {
        await markAsUnreadMutation.mutateAsync(notification.id);
        handleApiSuccess("Notification marked as unread");
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to mark as unread" });
      }
    },
    [markAsUnreadMutation, refetch],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      handleApiSuccess("All notifications marked as read");
      refetch();
    } catch (err) {
      handleApiError(err, { defaultMessage: "Failed to mark all as read" });
    }
  }, [markAllAsReadMutation, refetch]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess("Notification deleted");
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to delete notification" });
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteMutation, refetch],
  );

  const handleDeleteAllRead = useCallback(async () => {
    try {
      await deleteAllReadMutation.mutateAsync();
      handleApiSuccess("Read notifications deleted");
      refetch();
    } catch (err) {
      handleApiError(err, { defaultMessage: "Failed to delete read notifications" });
    } finally {
      setConfirmDeleteReadOpen(false);
    }
  }, [deleteAllReadMutation, refetch]);

  const handleDeleteAll = useCallback(async () => {
    try {
      await deleteAllMutation.mutateAsync();
      handleApiSuccess("All notifications deleted");
      refetch();
    } catch (err) {
      handleApiError(err, { defaultMessage: "Failed to delete notifications" });
    } finally {
      setConfirmDeleteAllOpen(false);
    }
  }, [deleteAllMutation, refetch]);

  const getTypeBadgeVariant = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return "default";
      case NotificationType.WARNING:
        return "secondary";
      case NotificationType.ERROR:
        return "destructive";
      case NotificationType.SYSTEM:
        return "outline";
      default:
        return "default";
    }
  };

  const columns = useMemo<ColumnDef<Notification>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const notification = row.original;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <span className="inline-flex size-2 rounded-full bg-primary" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    !notification.isRead && "font-semibold",
                  )}
                >
                  {notification.title}
                </span>
              </div>
              {notification.message && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {notification.message}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant={getTypeBadgeVariant(row.original.type)}>
            {typeLabels[row.original.type]}
          </Badge>
        ),
      },
      {
        accessorKey: "isRead",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isRead ? "secondary" : "default"}>
            {row.original.isRead ? "Read" : "Unread"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-right">Created</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm text-muted-foreground">
            {row.original.createdAt
              ? dateFormatter.format(new Date(row.original.createdAt))
              : "—"}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="flex justify-end text-muted-foreground">
            <IconDotsVertical className="size-4" aria-hidden />
          </div>
        ),
        cell: ({ row }) => {
          const notification = row.original;
          return (
            <div
              className="flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open notification actions"
                  >
                    <IconDotsVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {!notification.isRead ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleMarkAsRead(notification);
                      }}
                    >
                      <IconCheck className="mr-2 size-4" />
                      Mark as read
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleMarkAsUnread(notification);
                      }}
                    >
                      <IconBell className="mr-2 size-4" />
                      Mark as unread
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      setConfirmDeleteId(notification.id);
                    }}
                  >
                    <IconTrash className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [handleMarkAsRead, handleMarkAsUnread]);

  const renderDetails = useCallback((notification: Notification) => {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Title</div>
            <div className="font-medium text-foreground">{notification.title}</div>
          </div>
          {notification.message && (
            <div>
              <div className="text-xs text-muted-foreground">Message</div>
              <div className="text-foreground">{notification.message}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground">Type</div>
              <div className="text-sm font-medium">{typeLabels[notification.type]}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="text-sm font-medium">
                {notification.isRead ? "Read" : "Unread"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Created at</div>
              <div className="text-sm font-medium">
                {notification.createdAt
                  ? dateFormatter.format(new Date(notification.createdAt))
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Updated at</div>
              <div className="text-sm font-medium">
                {notification.updatedAt
                  ? dateFormatter.format(new Date(notification.updatedAt))
                  : "—"}
              </div>
            </div>
            {notification.readAt && (
              <div>
                <div className="text-muted-foreground">Read at</div>
                <div className="text-sm font-medium">
                  {dateFormatter.format(new Date(notification.readAt))}
                </div>
              </div>
            )}
          </div>
          {notification.actionUrl && (
            <div>
              <div className="text-xs text-muted-foreground">Action URL</div>
              <div className="text-sm font-medium break-all">
                {notification.actionUrl}
              </div>
            </div>
          )}
          {notification.actionLabel && (
            <div>
              <div className="text-xs text-muted-foreground">Action Label</div>
              <div className="text-sm font-medium">{notification.actionLabel}</div>
            </div>
          )}
        </div>
        {notification.metadata && (
          <div className="rounded-lg border bg-muted/30 p-4 text-xs">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Metadata
            </div>
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(notification.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }, []);

  if (error) {
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load notifications.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Review alerts and system messages related to your account.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total: {total} • Unread: {unreadCount}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || markAllAsReadMutation.isLoading}
            >
              <IconCheck className="mr-2 size-4" />
              Mark all as read
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteReadOpen(true)}
              disabled={deleteAllReadMutation.isLoading}
            >
              <IconTrash className="mr-2 size-4" />
              Delete read
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteAllOpen(true)}
              disabled={deleteAllMutation.isLoading}
            >
              <IconX className="mr-2 size-4" />
              Delete all
            </Button>
          </div>
        </div>

        <DashboardDataTable
          columns={columns}
          data={notifications}
          loading={isLoading}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
          renderDetails={renderDetails}
          detailsTitle={(notification) => notification.title}
          detailsDescription={(notification) => notification.message ?? ""}
          emptyMessage="No notifications found"
          headerFilters={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={readFilter}
                onValueChange={(value: "all" | "read" | "unread") => {
                  setPageIndex(0);
                  setReadFilter(value);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Read status" />
                </SelectTrigger>
                <SelectContent>
                  {readFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setPageIndex(0);
                  setTypeFilter(value as NotificationType | "all");
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.values(NotificationType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

      <AlertDialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this notification. This cannot be
            undone.
          </AlertDesc>
          <AlertFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && void handleDelete(confirmDeleteId)}
              disabled={deleteMutation.isLoading}
            >
              Delete
            </AlertDialogAction>
          </AlertFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDeleteReadOpen}
        onOpenChange={setConfirmDeleteReadOpen}
      >
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Delete read notifications?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This will delete all notifications that have already been marked as read.
          </AlertDesc>
          <AlertFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteAllRead()}
              disabled={deleteAllReadMutation.isLoading}
            >
              Delete read
            </AlertDialogAction>
          </AlertFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteAllOpen} onOpenChange={setConfirmDeleteAllOpen}>
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This will delete every notification in your inbox. This action cannot be
            undone.
          </AlertDesc>
          <AlertFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteAll()}
              disabled={deleteAllMutation.isLoading}
            >
              Delete all
            </AlertDialogAction>
          </AlertFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
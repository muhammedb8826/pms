"use client";

import React, { useEffect } from 'react';
import { IconBell } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/features/notification/hooks/useNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationDropdown } from '@/components/notification-dropdown';

export function NotificationBell() {
  const {
    data,
    refetch,
    isFetching,
  } = useNotifications(
    {
      page: 1,
      limit: 10,
      isRead: false,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    },
    { pollingInterval: 30000 },
  );
  const [open, setOpen] = React.useState(false);

  const unreadCount = data?.unreadCount ?? 0;

  // Manual refetch when dropdown closes to keep data fresh
  useEffect(() => {
    if (!open) {
      void refetch();
    }
  }, [open, refetch]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <IconBell className="size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0" align="end">
        <NotificationDropdown
          onClose={() => setOpen(false)}
          data={data}
          loading={isFetching}
          externalRefetch={refetch}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


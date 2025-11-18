"use client";

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { IconDotsVertical, IconPlus, IconPencil, IconSettings, IconTrash } from '@tabler/icons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DashboardDataTable } from '@/components/dashboard-data-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { USER_GENDERS, USER_ROLES, User, UserGender, UserRole, UserSortBy } from '@/features/user/types';
import { useDeleteUser, useUpdateUser, useUsers } from '@/features/user/hooks/useUsers';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const roleLabel = (role: string) => role.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
const genderLabel = (gender?: string | null) =>
  gender ? gender.charAt(0) + gender.slice(1).toLowerCase() : '—';
const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

function resolveProfileUrl(path?: string | null) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    try {
      const url = new URL(base);
      return `${url.origin}${path.startsWith('/') ? path : `/${path}`}`;
    } catch {
      // fall through to window origin handling
    }
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<UserSortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const router = useRouter();

  const { users, total, loading, isFetching, refetch } = useUsers(page, pageSize, {
    search: search.trim() || undefined,
    role: (roleFilter as UserRole) || '',
    gender: (genderFilter as UserGender) || '',
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy,
    sortOrder: sortOrder.toUpperCase() as 'ASC' | 'DESC',
  });

  const deleteMutation = useDeleteUser();
  const statusMutation = useUpdateUser();

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const handleEdit = useCallback((user: User) => {
    router.push(`/users/${user.id}/edit`);
  }, [router]);

  const handleCreate = useCallback(() => {
    router.push('/users/new');
  }, [router]);

  const handleToggleActive = useCallback(async (user: User) => {
    try {
      await statusMutation.mutateAsync({ id: user.id, data: { isActive: !user.isActive } });
      handleApiSuccess(user.isActive ? 'User deactivated' : 'User activated');
      refetch();
    } catch (err) {
      handleApiError(err, { defaultMessage: 'Failed to update status' });
    }
  }, [refetch, statusMutation]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      handleApiSuccess('User deleted successfully');
      refetch();
    } catch (err) {
      handleApiError(err, { defaultMessage: 'Failed to delete user' });
    } finally {
      setConfirmDeleteId(null);
    }
  }, [deleteMutation, refetch]);

  const renderDetails = useCallback((user: User) => {
    const fullName = `${user.firstName} ${user.lastName ?? ''}`.trim() || user.email;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 rounded-lg">
            {user.profile ? (
              <AvatarImage src={resolveProfileUrl(user.profile)} alt={fullName} />
            ) : (
              <AvatarFallback className="rounded-lg">
                {user.firstName?.[0]}
                {user.lastName?.[0] ?? ''}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col gap-1">
            <Badge variant={user.isActive ? 'default' : 'outline'} className="w-fit">
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <div className="flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {roleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Email</div>
            <div className="text-sm font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Phone</div>
            <div className="text-sm">{user.phone}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Gender</div>
            <div className="text-sm">{genderLabel(user.gender)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Created</div>
            <div className="text-sm">{formatDate(user.createdAt)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Updated</div>
            <div className="text-sm">{formatDate(user.updatedAt)}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Address</div>
            <div className="text-sm">{user.address || '—'}</div>
          </div>
        </div>
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original;
        const fullName = `${user.firstName} ${user.lastName ?? ''}`.trim() || user.email;
        const initials = fullName
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-lg">
              {user.profile ? (
                <AvatarImage src={resolveProfileUrl(user.profile)} alt={fullName} />
              ) : (
                <AvatarFallback className="rounded-lg text-xs font-medium">{initials || 'US'}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{fullName}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((role) => (
            <Badge key={role} variant="secondary">
              {roleLabel(role)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-sm">{row.original.phone}</span>,
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{genderLabel(row.original.gender)}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'outline'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: () => (
        <div className="flex justify-end text-muted-foreground">
          <IconSettings className="size-4" aria-hidden />
        </div>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground data-[state=open]:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <IconDotsVertical />
                  <span className="sr-only">Open user actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleEdit(user);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  Edit user
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleToggleActive(user);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {user.isActive ? 'Deactivate user' : 'Activate user'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirmDeleteId(user.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <span className="flex items-center gap-2">
                    <IconTrash className="size-4" />
                    Delete user
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [handleEdit, handleToggleActive]);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Users</h1>
            <p className="text-sm text-muted-foreground">Manage user accounts, roles, and access.</p>
          </div>
          <Button onClick={handleCreate}>
            <IconPlus className="mr-2 size-4" />
            Create User
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={users}
          pageIndex={page - 1}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={(index: number) => {
            const nextPage = Math.min(Math.max(index + 1, 1), pageCount);
            setPage(nextPage);
          }}
          onPageSizeChange={(size: number) => {
            setPageSize(size);
            setPage(1);
          }}
          loading={loading || isFetching}
          emptyMessage="No users found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(user) => `${user.firstName} ${user.lastName ?? ''}`.trim() || user.email}
          detailsDescription={(user) => user.email}
          renderDetailsFooter={(user, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  router.push(`/users/${user.id}/edit`);
                }, 0);
              }}
              className="w-full"
            >
              <IconPencil className="mr-2 size-4" />
              Edit User
            </Button>
          )}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search users..."
                className="w-full min-w-0 sm:w-48"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Select value={roleFilter || "__all__"} onValueChange={(value) => {
                setRoleFilter(value === "__all__" ? "" : value);
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All roles</SelectItem>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={genderFilter || "__all__"} onValueChange={(value) => {
                setGenderFilter(value === "__all__" ? "" : value);
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="All genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All genders</SelectItem>
                  {USER_GENDERS.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {genderLabel(gender)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => {
                const next = value === 'active' ? 'active' : value === 'inactive' ? 'inactive' : 'all';
                setStatusFilter(next);
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value) => {
                if (value && ['createdAt', 'firstName', 'lastName', 'email'].includes(value)) {
                  setSortBy(value as UserSortBy);
                } else {
                  setSortBy('createdAt');
                }
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created</SelectItem>
                  <SelectItem value="firstName">First name</SelectItem>
                  <SelectItem value="lastName">Last name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value) => {
                const next = value === 'asc' ? 'asc' : 'desc';
                setSortOrder(next);
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

      <AlertDialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this user. This cannot be undone.
          </AlertDesc>
          <AlertFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) {
                  void handleDelete(confirmDeleteId);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

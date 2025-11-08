"use client";

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { IconDotsVertical, IconPlus, IconSettings, IconTrash } from '@tabler/icons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ListDataTable } from '@/components/list-data-table';
import { USER_GENDERS, USER_ROLES, User, UserGender, UserRole, UserSortBy } from '@/features/user/types';
import { useDeleteUser, useUpdateUser, useUser, useUsers } from '@/features/user/hooks/useUsers';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter as DrawerFooterSection, DrawerHeader as DrawerHeaderSection, DrawerTitle } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<UserSortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const router = useRouter();

  const { users, total, loading, isFetching, refetch } = useUsers(page, pageSize, {
    search: search.trim() || undefined,
    role: (roleFilter as UserRole) || '',
    gender: (genderFilter as UserGender) || '',
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy,
    sortOrder: sortOrder.toUpperCase() as 'ASC' | 'DESC',
  });

  const viewQuery = useUser(viewOpen ? viewId : null);
  const deleteMutation = useDeleteUser();
  const statusMutation = useUpdateUser();

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const handleView = useCallback((user: User) => {
    setViewId(user.id);
    setViewOpen(true);
  }, []);

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
      if (viewId === id) {
        setViewOpen(false);
        setViewId(null);
      }
      refetch();
    } catch (err) {
      handleApiError(err, { defaultMessage: 'Failed to delete user' });
    }
  }, [deleteMutation, refetch, viewId]);

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
              <button
                type="button"
                className="text-sm font-semibold text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                onClick={() => handleView(user)}
              >
                {fullName}
              </button>
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
                <Button variant="ghost" size="icon" className="text-muted-foreground data-[state=open]:bg-muted">
                  <IconDotsVertical />
                  <span className="sr-only">Open user actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={(event) => { event.preventDefault(); handleView(user); }}>
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(event) => { event.preventDefault(); handleEdit(user); }}>
                  Edit user
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    handleToggleActive(user);
                  }}
                >
                  {user.isActive ? 'Deactivate user' : 'Activate user'}
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(event) => event.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <span className="flex items-center gap-2">
                        <IconTrash className="size-4" />
                        Delete user
                      </span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertHeader>
                      <AlertDialogTitle>Delete user?</AlertDialogTitle>
                    </AlertHeader>
                    <AlertDesc>
                      This action will permanently delete <span className="font-medium">{user.email}</span>. This cannot be undone.
                    </AlertDesc>
                    <AlertFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [deleteMutation.isPending, handleDelete, handleEdit, handleToggleActive, handleView]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleRoleChange = (value?: string) => {
    setRoleFilter(value ?? '');
    setPage(1);
  };

  const handleGenderChange = (value?: string) => {
    setGenderFilter(value ?? '');
    setPage(1);
  };

  const handleStatusChange = (value?: string) => {
    const next = value === 'active' ? 'active' : value === 'inactive' ? 'inactive' : 'all';
    setStatusFilter(next);
    setPage(1);
  };

  const handleSortByChange = (value?: string) => {
    if (value && ['createdAt', 'firstName', 'lastName', 'email'].includes(value)) {
      setSortBy(value as UserSortBy);
    } else {
      setSortBy('createdAt');
    }
    setPage(1);
  };

  const handleSortOrderChange = (value?: string) => {
    const next = value === 'asc' ? 'asc' : value === 'desc' ? 'desc' : 'desc';
    setSortOrder(next);
    setPage(1);
  };

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
        <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Search users..."
            className="w-full min-w-0 sm:w-48"
            value={search}
            onChange={handleSearchChange}
          />
          <Select value={roleFilter} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="">All roles</SelectItem>
              {USER_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={handleGenderChange}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="All genders" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="">All genders</SelectItem>
              {USER_GENDERS.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {genderLabel(gender)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => handleStatusChange(value)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => handleSortByChange(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="firstName">First name</SelectItem>
              <SelectItem value="lastName">Last name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(value) => handleSortOrderChange(value)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ListDataTable
          columns={columns}
          data={users}
          pageIndex={page - 1}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={(nextIndex) => {
            const nextPage = Math.min(Math.max(nextIndex + 1, 1), pageCount);
            setPage(nextPage);
          }}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(1);
          }}
          loading={loading || isFetching}
          emptyMessage="No users found"
        />
      </div>
      <Drawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setViewId(null);
        }}
        direction={isMobile ? 'bottom' : 'right'}
      >
        <DrawerContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DrawerHeaderSection className="gap-2">
            <DrawerTitle>{viewQuery.data ? `${viewQuery.data.firstName} ${viewQuery.data.lastName ?? ''}`.trim() : 'User Details'}</DrawerTitle>
            {viewQuery.data?.email && <DrawerDescription>{viewQuery.data.email}</DrawerDescription>}
          </DrawerHeaderSection>
          <div className="space-y-6 px-4 pb-4">
            {viewQuery.isLoading ? (
              <div>Loading…</div>
            ) : viewQuery.error ? (
              <div className="text-sm text-destructive">
                {viewQuery.error instanceof Error ? viewQuery.error.message : 'Failed to load user details'}
              </div>
            ) : viewQuery.data ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 rounded-lg">
                    {viewQuery.data.profile ? (
                      <AvatarImage src={resolveProfileUrl(viewQuery.data.profile)} alt={viewQuery.data.email} />
                    ) : (
                      <AvatarFallback className="rounded-lg">
                        {viewQuery.data.firstName?.[0]}
                        {viewQuery.data.lastName?.[0] ?? ''}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <Badge variant={viewQuery.data.isActive ? 'default' : 'outline'} className="w-fit">
                      {viewQuery.data.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {viewQuery.data.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {roleLabel(role)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Email</div>
                    <div className="text-sm">{viewQuery.data.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Phone</div>
                    <div className="text-sm">{viewQuery.data.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Gender</div>
                    <div className="text-sm">{genderLabel(viewQuery.data.gender)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                    <div className="text-sm">{formatDate(viewQuery.data.createdAt)}</div>
                  </div>
    <div>
                    <div className="text-xs text-muted-foreground mb-1">Updated</div>
                    <div className="text-sm">{formatDate(viewQuery.data.updatedAt)}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">Address</div>
                    <div className="text-sm">{viewQuery.data.address || '—'}</div>
                  </div>
                </div>
              </>
            ) : (
              <div>No data available</div>
            )}
          </div>
          <DrawerFooterSection>
            {viewQuery.data && (
              <Button
                variant="outline"
                onClick={() => {
                  setViewOpen(false);
                  if (viewQuery.data) {
                    router.push(`/users/${viewQuery.data.id}/edit`);
                  }
                }}
              >
                Edit user
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="secondary">Close</Button>
            </DrawerClose>
          </DrawerFooterSection>
        </DrawerContent>
      </Drawer>
    </div>
  );
}


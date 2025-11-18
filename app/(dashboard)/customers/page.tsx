"use client";

import React, { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { IconDotsVertical, IconFilePlus, IconPencil, IconSettings } from '@tabler/icons-react';
import { useCustomers, useDeleteCustomer } from '@/features/customer/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialog } from '@/components/form-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDesc,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DashboardDataTable } from '@/components/dashboard-data-table';
import CustomerForm from '@/features/customer/components/CustomerForm';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import type { Customer } from '@/features/customer/types';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const { customers, total, loading, error, refetch } = useCustomers(page, pageSize, { search, sortBy, sortOrder });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteCustomer();

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize) || 1), [total, pageSize]);

  const editingCustomer = useMemo(() => {
    return editingId ? customers.find((c) => c.id === editingId) ?? null : null;
  }, [editingId, customers]);

  const handleEdit = useCallback((customer: Customer) => {
    setEditingId(customer.id);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess('Customer deleted successfully');
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to delete customer' });
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteMutation, refetch],
  );

  const getStatusBadgeVariant = (status: string) => {
    return status === 'ACTIVE' ? 'default' : 'outline';
  };

  const renderDetails = useCallback((customer: Customer) => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-medium text-foreground">{customer.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Phone</div>
            <div className="text-foreground">{customer.phone || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="text-foreground">{customer.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Address</div>
            <div className="text-foreground">{customer.address || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="mt-1">
              <Badge variant={getStatusBadgeVariant(customer.status)}>{customer.status}</Badge>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-foreground">
              {customer.createdAt ? dateFormatter.format(new Date(customer.createdAt)) : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Updated</div>
            <div className="text-foreground">
              {customer.updatedAt ? dateFormatter.format(new Date(customer.updatedAt)) : '—'}
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<Customer>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.phone || '—'}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.email || '—'}</span>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2">{row.original.address || '—'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusBadgeVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => (
        <div className="flex justify-end text-muted-foreground">
          <IconSettings className="size-4" aria-hidden />
        </div>
      ),
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open actions"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground data-[state=open]:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <IconDotsVertical />
                  <span className="sr-only">Open customer actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleEdit(customer);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <span className="flex items-center gap-2">
                    <IconPencil className="size-4" />
                    Edit customer
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirmDeleteId(customer.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  Delete customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [handleEdit]);

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Customers</h1>
            <p className="text-sm text-muted-foreground">Manage customer records and contact details.</p>
            <p className="mt-1 text-xs text-muted-foreground">Total customers: {total}</p>
          </div>
          <Button onClick={() => { setEditingId(null); setDialogOpen(true); }}>
            <IconFilePlus className="mr-2 size-4" />
            Add Customer
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={customers}
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
          loading={loading}
          emptyMessage="No customers found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(customer) => customer.name}
          detailsDescription={(customer) => customer.email || ''}
          renderDetailsFooter={(customer, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  handleEdit(customer);
                }, 0);
              }}
              className="w-full"
            >
              <IconPencil className="mr-2 size-4" />
              Edit Customer
            </Button>
          )}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search..."
                className="w-full min-w-0 sm:w-48"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Select value={sortBy} onValueChange={(v) => {
                setSortBy(v || 'name');
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="createdAt">Created</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v) => {
                setSortOrder((v || 'ASC') as 'ASC' | 'DESC');
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">ASC</SelectItem>
                  <SelectItem value="DESC">DESC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditingId(null);
            setFormError(null);
            setFormSubmitting(false);
          }
        }}
        title={editingId ? 'Edit Customer' : 'Add Customer'}
        size="2xl"
        error={formError}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingId(null);
              }}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="customer-form" disabled={formSubmitting}>
              {formSubmitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <CustomerForm
          customer={editingCustomer}
          onSuccess={() => {
            setDialogOpen(false);
            setEditingId(null);
            refetch();
          }}
          onCancel={() => {
            setDialogOpen(false);
            setEditingId(null);
          }}
          onErrorChange={setFormError}
          onSubmittingChange={setFormSubmitting}
          formId="customer-form"
          hideActions
        />
      </FormDialog>

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
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this customer. This cannot be undone.
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

"use client";

import React, { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { IconDotsVertical, IconFilePlus, IconPencil, IconSettings } from '@tabler/icons-react';
import { Supplier } from '@/features/supplier/types';
import { useSuppliers, useDeleteSupplier } from '@/features/supplier/hooks/useSuppliers';
import { SupplierForm } from '@/features/supplier/components/SupplierForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { DashboardDataTable } from '@/components/dashboard-data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function Page() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { suppliers, total, loading, error, refetch } = useSuppliers(page, pageSize, {
    search,
    sortBy,
    sortOrder: sortOrder.toUpperCase() as 'ASC' | 'DESC',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteSupplier();

  const pageCount = useMemo(() => {
    if (pageSize === 0) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess('Supplier deleted');
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to delete supplier' });
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteMutation, refetch],
  );

  const handleEdit = useCallback((supplier: Supplier) => {
    setEditing(supplier);
    setDialogOpen(true);
  }, []);

  const renderDetails = useCallback((supplier: Supplier) => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-medium text-foreground">{supplier.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Contact</div>
            <div className="text-foreground">{supplier.contact || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="text-foreground">{supplier.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Address</div>
            <div className="text-foreground">{supplier.address || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-foreground">
              {supplier.createdAt ? dateFormatter.format(new Date(supplier.createdAt)) : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Updated</div>
            <div className="text-foreground">
              {supplier.updatedAt ? dateFormatter.format(new Date(supplier.updatedAt)) : '—'}
            </div>
          </div>
        </div>
        {supplier.batches && supplier.batches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Batches ({supplier.batches.length})</span>
              <Badge variant="outline">{supplier.batches.length}</Badge>
            </div>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              This supplier has {supplier.batches.length} batch(es).
            </div>
          </div>
        )}
        {supplier.purchases && supplier.purchases.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Purchases ({supplier.purchases.length})</span>
              <Badge variant="outline">{supplier.purchases.length}</Badge>
            </div>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              This supplier has {supplier.purchases.length} purchase(s).
            </div>
          </div>
        )}
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<Supplier>[]>(() => [
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
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.contact || '—'}</span>
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
      id: 'actions',
      header: () => (
        <div className="flex justify-end text-muted-foreground">
          <IconSettings className="size-4" aria-hidden />
        </div>
      ),
      cell: ({ row }) => {
        const supplier = row.original;
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
                  <span className="sr-only">Open supplier actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleEdit(supplier);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <span className="flex items-center gap-2">
                    <IconPencil className="size-4" />
                    Edit supplier
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirmDeleteId(supplier.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  Delete supplier
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

  function onFormSuccess() {
    setDialogOpen(false);
    setEditing(null);
    refetch();
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Suppliers</h1>
            <p className="text-sm text-muted-foreground">Manage supplier records and contact details.</p>
            <p className="mt-1 text-xs text-muted-foreground">Total suppliers: {total}</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <IconFilePlus className="mr-2 size-4" />
            Add Supplier
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={suppliers}
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
          emptyMessage="No suppliers found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(supplier) => supplier.name}
          detailsDescription={(supplier) => supplier.email || ''}
          renderDetailsFooter={(supplier, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  handleEdit(supplier);
                }, 0);
              }}
              className="w-full"
            >
              <IconPencil className="mr-2 size-4" />
              Edit Supplier
            </Button>
          )}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search suppliers..."
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
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="createdAt">Created</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v) => {
                setSortOrder((v || 'asc') as 'asc' | 'desc');
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setFormError(null);
            setFormSubmitting(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Supplier' : 'Create Supplier'}</DialogTitle>
          </DialogHeader>
          <SupplierForm
            supplier={editing}
            onSuccess={onFormSuccess}
            onCancel={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
            onErrorChange={setFormError}
            onSubmittingChange={setFormSubmitting}
            formId="supplier-form"
            hideActions
          />
          {formError && <div className="text-red-600 text-sm">{formError}</div>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="supplier-form" disabled={formSubmitting}>
              {formSubmitting ? 'Saving…' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this supplier. This cannot be undone.
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

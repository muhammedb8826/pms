"use client";

import React, { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Supplier } from '@/features/supplier/types';
import { useSuppliers, useDeleteSupplier, useSupplier } from '@/features/supplier/hooks/useSuppliers';
import { SupplierForm } from '@/features/supplier/components/SupplierForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { IconDotsVertical, IconEye, IconPencil, IconSettings, IconTrash } from '@tabler/icons-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ListDataTable } from '@/components/list-data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter as DrawerFooterSection, DrawerHeader as DrawerHeaderSection, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Page() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { suppliers, total, loading, error, refetch } = useSuppliers(page, limit, { 
    search, 
    sortBy, 
    sortOrder: sortOrder.toUpperCase() as 'ASC' | 'DESC' 
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewQuery = useSupplier(viewId ?? undefined);
  const deleteMutation = useDeleteSupplier();
  const isMobile = useIsMobile();
  const supplierDetails = viewQuery.data ?? null;

  const pageCount = useMemo(() => {
    if (limit === 0) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
      toast.success('Supplier deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete supplier';
      toast.error(message);
    }
  }, [deleteMutation, refetch]);

  const columns = useMemo<ColumnDef<Supplier>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Button variant="link" className="font-medium px-0" onClick={() => { setViewId(row.original.id); setViewOpen(true); }}>
          {row.original.name}
        </Button>
      ),
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => row.original.contact || '-',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => row.original.address || '-',
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
                <Button aria-label="Open actions" variant="ghost" size="icon" className="text-muted-foreground data-[state=open]:bg-muted">
                  <IconDotsVertical />
                  <span className="sr-only">Open supplier actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => { setViewId(supplier.id); setViewOpen(true); }}>
                  <span className="flex items-center gap-2">
                    <IconEye className="size-4" />
                    View details
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setEditing(supplier); setDialogOpen(true); }}>
                  <span className="flex items-center gap-2">
                    <IconPencil className="size-4" />
                    Edit supplier
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(event) => event.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <span className="flex items-center gap-2">
                        <IconTrash className="size-4" />
                        Delete supplier
                      </span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertHeader>
                      <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
                    </AlertHeader>
                    <AlertDesc>
                      This action will permanently delete <span className="font-medium">{supplier.name}</span>. This cannot be undone.
                    </AlertDesc>
                    <AlertFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(supplier.id)} disabled={deleteMutation.isPending}>Delete</AlertDialogAction>
                    </AlertFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [deleteMutation.isPending, handleDelete]);

  function onFormSuccess() {
    setDialogOpen(false);
    setEditing(null);
    refetch();
  }

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Suppliers</h1>
            <p className="text-sm text-muted-foreground">Manage supplier records and contact details.</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>Add Supplier</Button>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Input placeholder="Search suppliers..." className="w-full min-w-0 sm:w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v || 'name')}>
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
          <Select value={sortOrder} onValueChange={(v) => setSortOrder((v || 'asc') as 'asc' | 'desc')}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ListDataTable
          columns={columns}
          data={suppliers}
          pageIndex={page - 1}
          pageSize={limit}
          pageCount={pageCount}
          onPageChange={(next) => {
            if (next < 0) return;
            const nextPage = Math.min(Math.max(next + 1, 1), pageCount);
            setPage(nextPage);
          }}
          onPageSizeChange={(size) => {
            setLimit(size);
            setPage(1);
          }}
          loading={loading}
          emptyMessage="No suppliers found"
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setFormError(null); setFormSubmitting(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Supplier' : 'Create Supplier'}</DialogTitle>
          </DialogHeader>
          <SupplierForm
            supplier={editing}
            onSuccess={onFormSuccess}
            onCancel={() => { setDialogOpen(false); setEditing(null); }}
            onErrorChange={setFormError}
            onSubmittingChange={setFormSubmitting}
            formId="supplier-form"
            hideActions
          />
          {formError && <div className="text-red-600 text-sm">{formError}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }} disabled={formSubmitting}>Cancel</Button>
            <Button type="submit" form="supplier-form" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Drawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setViewId(null);
        }}
        direction={isMobile ? 'bottom' : 'right'}
      >
        <DrawerContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DrawerHeaderSection className="gap-1">
            <DrawerTitle>{supplierDetails?.name ?? 'Supplier Details'}</DrawerTitle>
            {supplierDetails?.email ? (
              <DrawerDescription>{supplierDetails.email}</DrawerDescription>
            ) : null}
          </DrawerHeaderSection>
          <div className="space-y-4 px-4 pb-4">
            {viewQuery.isLoading ? (
              <div>Loading…</div>
            ) : viewQuery.error ? (
              <div className="text-red-600 text-sm">{viewQuery.error instanceof Error ? viewQuery.error.message : 'Failed to load'}</div>
            ) : supplierDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Name</div>
                    <div className="font-medium">{supplierDetails.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Contact</div>
                    <div>{supplierDetails.contact || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Email</div>
                    <div>{supplierDetails.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Address</div>
                    <div>{supplierDetails.address || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Created At</div>
                    <div>{supplierDetails.createdAt ? new Date(supplierDetails.createdAt).toLocaleString() : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Updated At</div>
                    <div>{supplierDetails.updatedAt ? new Date(supplierDetails.updatedAt).toLocaleString() : '-'}</div>
                  </div>
                </div>
                {supplierDetails.batches && supplierDetails.batches.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Batches ({supplierDetails.batches.length})</div>
                    <div className="text-sm">This supplier has {supplierDetails.batches.length} batch(es).</div>
                  </div>
                )}
                {supplierDetails.purchases && supplierDetails.purchases.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Purchases ({supplierDetails.purchases.length})</div>
                    <div className="text-sm">This supplier has {supplierDetails.purchases.length} purchase(s).</div>
                  </div>
                )}
              </div>
            ) : (
              <div>No data available</div>
            )}
          </div>
          <DrawerFooterSection>
            {supplierDetails && (
              <Button variant="outline" onClick={() => { setEditing(supplierDetails); setDialogOpen(true); }}>
                Edit supplier
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



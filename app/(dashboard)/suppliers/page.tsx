"use client";

import React, { useMemo, useState } from 'react';
import { Supplier } from '@/features/supplier/types';
import { useSuppliers, useDeleteSupplier, useSupplier } from '@/features/supplier/hooks/useSuppliers';
import { SupplierForm } from '@/features/supplier/components/SupplierForm';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Page() {
  const [page, setPage] = useState(1);
  const limit = 10;
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

  const canNext = useMemo(() => {
    const shown = (page - 1) * limit + suppliers.length;
    return shown < total;
  }, [suppliers.length, total, page]);

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
      toast.success('Supplier deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete supplier';
      toast.error(message);
    }
  }

  function onFormSuccess() {
    setDialogOpen(false);
    setEditing(null);
    refetch();
  }

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex items-start justify-between gap-2 sm:items-center">
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Input placeholder="Search..." className="w-full min-w-0 sm:w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
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
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>Add Supplier</Button>
        </div>
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

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No suppliers found</TableCell>
              </TableRow>
            ) : (
              suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.contact || '-'}</TableCell>
                  <TableCell>{s.email || '-'}</TableCell>
                  <TableCell>{s.address || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label="View" variant="ghost" size="sm" onClick={() => { setViewId(s.id); setViewOpen(true); }}>
                            <IconEye />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label="Edit" variant="ghost" size="sm" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                            <IconPencil />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button aria-label="Delete" variant="destructive" size="sm" disabled={deleteMutation.isPending}>
                                <IconTrash />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertHeader>
                            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
                          </AlertHeader>
                          <AlertDesc>
                            This action will permanently delete <span className="font-medium">{s.name}</span>. This cannot be undone.
                          </AlertDesc>
                          <AlertFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(s.id)} disabled={deleteMutation.isPending}>Delete</AlertDialogAction>
                          </AlertFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + suppliers.length} of {total}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>Next</Button>
        </div>
      </div>

      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) setViewId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
            {viewQuery.data?.id ? (
              <DialogDescription>ID: {viewQuery.data.id}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="space-y-4">
            {viewQuery.isLoading ? (
              <div>Loading…</div>
            ) : viewQuery.error ? (
              <div className="text-red-600 text-sm">{viewQuery.error instanceof Error ? viewQuery.error.message : 'Failed to load'}</div>
            ) : viewQuery.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Name</div>
                    <div className="font-medium">{viewQuery.data.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Contact</div>
                    <div>{viewQuery.data.contact || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Email</div>
                    <div>{viewQuery.data.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Address</div>
                    <div>{viewQuery.data.address || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Created At</div>
                    <div>{new Date(viewQuery.data.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Updated At</div>
                    <div>{new Date(viewQuery.data.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
                {viewQuery.data.batches && viewQuery.data.batches.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Batches ({viewQuery.data.batches.length})</div>
                    <div className="text-sm">This supplier has {viewQuery.data.batches.length} batch(es)</div>
                  </div>
                )}
                {viewQuery.data.purchases && viewQuery.data.purchases.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Purchases ({viewQuery.data.purchases.length})</div>
                    <div className="text-sm">This supplier has {viewQuery.data.purchases.length} purchase(s)</div>
                  </div>
                )}
              </div>
            ) : (
              <div>No data available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

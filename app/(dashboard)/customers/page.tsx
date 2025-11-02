"use client";

import React, { useMemo, useState } from 'react';
import { useCustomers, useCustomer, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/features/customer/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IconEye, IconPencil, IconTrash, IconFilePlus } from '@tabler/icons-react';
import CustomerForm from '@/features/customer/components/CustomerForm';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const { customers, total, loading, error, refetch } = useCustomers(page, limit, { search, sortBy, sortOrder });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewQuery = useCustomer(viewId ?? undefined);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createMutation = useCreateCustomer();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const canNext = useMemo(() => ((page - 1) * limit + customers.length) < total, [page, limit, customers.length, total]);

  async function handleDelete(id: string) {
    try {
      const result = await deleteMutation.mutateAsync(id);
      if (result && typeof result === 'object' && 'error' in result && (result as { error?: unknown }).error) {
        handleApiError((result as { error?: unknown }).error, { defaultMessage: 'Failed to delete customer' });
        return;
      }
      refetch();
      handleApiSuccess('Customer deleted successfully');
    } catch (err) {
      handleApiError(err, { defaultMessage: 'Failed to delete customer' });
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <Button onClick={() => { setEditingId(null); setDialogOpen(true); }}><IconFilePlus />Add Customer</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={sortBy} onValueChange={(v) => setSortBy(v || 'name')}>
          <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="address">Address</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="createdAt">Created</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder((v || 'ASC') as 'ASC' | 'DESC')}>
          <SelectTrigger><SelectValue placeholder="Order" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ASC">ASC</SelectItem>
            <SelectItem value="DESC">DESC</SelectItem>
          </SelectContent>
        </Select>
        <div />
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone || '-'}</TableCell>
                  <TableCell>{c.email || '-'}</TableCell>
                  <TableCell>{c.address || '-'}</TableCell>
                  <TableCell>{c.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label="View" variant="ghost" size="sm" onClick={() => { setViewId(c.id); setViewOpen(true); }}>
                            <IconEye />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label="Edit" variant="outline" size="sm" onClick={() => { setEditingId(c.id); setDialogOpen(true); }}>
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
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {c.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(c.id)} disabled={deleteMutation.isPending}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + customers.length} of {total}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>Next</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={editingId ? (customers.find((x) => x.id === editingId) ?? null) : null}
            onSuccess={() => { setDialogOpen(false); setEditingId(null); refetch(); }}
            onCancel={() => { setDialogOpen(false); setEditingId(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) setViewId(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {viewQuery.isLoading ? (
            <div>Loading…</div>
          ) : viewQuery.error ? (
            <div className="text-red-600">Failed to load</div>
          ) : viewQuery.data ? (
            <div className="space-y-2">
              <div className="text-lg font-semibold">{viewQuery.data.name}</div>
              <div className="text-sm text-muted-foreground">{viewQuery.data.email || '-'}</div>
              <div className="text-sm text-muted-foreground">{viewQuery.data.phone || '-'}</div>
              <div className="text-sm text-muted-foreground">{viewQuery.data.address || '-'}</div>
              <div className="text-sm">Status: {viewQuery.data.status}</div>
              <div className="text-xs">Created: {new Date(viewQuery.data.createdAt).toLocaleString()}</div>
              <div className="text-xs">Updated: {new Date(viewQuery.data.updatedAt).toLocaleString()}</div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

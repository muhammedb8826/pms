"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PurchaseStatus } from '@/features/purchase/types';
import { usePurchases, useDeletePurchase, usePurchase } from '@/features/purchase/hooks/usePurchases';
import { useAllSuppliers } from '@/features/supplier/hooks/useSuppliers';
import type { Supplier } from '@/features/supplier/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const statusColors: Record<PurchaseStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  PARTIALLY_RECEIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

export default function Page() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { purchases, total, loading, error, refetch } = usePurchases(page, limit, { 
    search, 
    supplierId: supplierId || undefined,
    status: status || undefined,
    sortBy, 
    sortOrder: sortOrder.toUpperCase() as 'ASC' | 'DESC' 
  });
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewQuery = usePurchase(viewId ?? undefined);
  const deleteMutation = useDeletePurchase();
  const allSuppliersQuery = useAllSuppliers();
  
  // Ensure allSuppliers is always an array, handling wrapped API responses
  const allSuppliers = React.useMemo(() => {
    type WrappedResponse<T> = {
      success: boolean;
      data: T;
    };
    const data = allSuppliersQuery.data as Supplier[] | WrappedResponse<Supplier[]> | undefined;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [];
  }, [allSuppliersQuery.data]);

  const canNext = useMemo(() => {
    const shown = (page - 1) * limit + purchases.length;
    return shown < total;
  }, [purchases.length, total, page]);

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
      toast.success('Purchase deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete purchase';
      toast.error(message);
    }
  }

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex items-start justify-between gap-2 sm:items-center">
        <h1 className="text-xl font-semibold">Purchases</h1>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Input placeholder="Search..." className="w-full min-w-0 sm:w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={supplierId} onValueChange={(v) => setSupplierId(v || '')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Suppliers</SelectItem>
              {allSuppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v || '')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="COMPLETED">COMPLETED</SelectItem>
              <SelectItem value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</SelectItem>
              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v || 'date')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="totalAmount">Total Amount</SelectItem>
              <SelectItem value="invoiceNo">Invoice No</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="createdAt">Created</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder((v || 'desc') as 'asc' | 'desc')}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => router.push('/purchases/new')}>Add Purchase</Button>
        </div>
      </div>


      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No purchases found</TableCell>
              </TableRow>
            ) : (
              purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.invoiceNo}</TableCell>
                  <TableCell>{p.supplier.name}</TableCell>
                  <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{Number(p.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[p.status]}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>{p.items?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label="View" variant="ghost" size="sm" onClick={() => { setViewId(p.id); setViewOpen(true); }}>
                            <IconEye />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>
                      {p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button aria-label="Edit" variant="ghost" size="sm" onClick={() => router.push(`/purchases/${p.id}/edit`)}>
                              <IconPencil />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                      )}
                      {p.status !== 'COMPLETED' && (
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
                              <AlertDialogTitle>Delete purchase?</AlertDialogTitle>
                            </AlertHeader>
                            <AlertDesc>
                              This action will permanently delete purchase <span className="font-medium">{p.invoiceNo}</span>. This cannot be undone.
                            </AlertDesc>
                            <AlertFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p.id)} disabled={deleteMutation.isPending}>Delete</AlertDialogAction>
                            </AlertFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + purchases.length} of {total}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>Next</Button>
        </div>
      </div>

      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) setViewId(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
            {viewQuery.data?.id ? (
              <DialogDescription>Invoice: {viewQuery.data.invoiceNo}</DialogDescription>
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
                    <div className="text-xs text-muted-foreground mb-1">Supplier</div>
                    {viewQuery.data.supplier ? (
                      <>
                        <div className="font-medium">{viewQuery.data.supplier.name}</div>
                        {viewQuery.data.supplier.contact && (
                          <div className="text-sm text-muted-foreground">{viewQuery.data.supplier.contact}</div>
                        )}
                        {viewQuery.data.supplier.email && (
                          <div className="text-sm text-muted-foreground">{viewQuery.data.supplier.email}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No supplier</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Date</div>
                    <div>{viewQuery.data.date ? new Date(viewQuery.data.date).toLocaleDateString() : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                    <Badge className={statusColors[viewQuery.data.status]}>{viewQuery.data.status}</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total Amount</div>
                    <div className="font-medium text-lg">{Number(viewQuery.data.totalAmount).toFixed(2)}</div>
                  </div>
                  {viewQuery.data.notes && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <div className="text-sm">{viewQuery.data.notes}</div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Items ({viewQuery.data.items?.length || 0})</div>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>UOM</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewQuery.data.items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product?.name || '-'}</TableCell>
                            <TableCell>{item.uom ? `${item.uom.name}${item.uom.abbreviation ? ` (${item.uom.abbreviation})` : ''}` : '-'}</TableCell>
                            <TableCell>{item.batchNumber || '-'}</TableCell>
                            <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{Number(item.unitCost).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">{Number(item.totalCost).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Created At</div>
                    <div className="text-sm">{viewQuery.data.createdAt ? new Date(viewQuery.data.createdAt).toLocaleString() : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Updated At</div>
                    <div className="text-sm">{viewQuery.data.updatedAt ? new Date(viewQuery.data.updatedAt).toLocaleString() : '-'}</div>
                  </div>
                </div>
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

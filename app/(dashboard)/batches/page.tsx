"use client";

import React, { useMemo, useState } from 'react';
import { useBatches } from '@/features/batch/hooks/useBatches';
import { useAllProducts } from '@/features/product/hooks/useProducts';
import { useAllSuppliers } from '@/features/supplier/hooks/useSuppliers';
import type { Supplier } from '@/features/supplier/types';
import type { Product } from '@/features/product/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IconPencil, IconTrash, IconFilePlus } from '@tabler/icons-react';
import BatchForm from '@/features/batch/components/BatchForm';
import { useCreateBatch, useDeleteBatch, useUpdateBatch } from '@/features/batch/hooks/useBatches';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

export default function BatchesPage() {
  const [productId, setProductId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [expiredOnly, setExpiredOnly] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { batches, loading, error, refetch } = useBatches({
    productId: productId || undefined,
    supplierId: supplierId || undefined,
    expiredOnly: expiredOnly === 'true' ? true : expiredOnly === 'false' ? false : undefined,
  });

  const productsQuery = useAllProducts();
  const suppliersQuery = useAllSuppliers();

  const products = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = productsQuery.data as Product[] | Wrapped<Product[]> | undefined;
    if (!data) return [] as Product[];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data as Product[];
    return [] as Product[];
  }, [productsQuery.data]);

  const suppliers = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = suppliersQuery.data as Supplier[] | Wrapped<Supplier[]> | undefined;
    if (!data) return [] as Supplier[];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data as Supplier[];
    return [] as Supplier[];
  }, [suppliersQuery.data]);

  // Prepare mutations (reserved for future inline edit/create)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createMutation = useCreateBatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateMutation = useUpdateBatch();
  const deleteMutation = useDeleteBatch();

  function resetModal() {
    setEditingId(null);
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    try {
      const result = await deleteMutation.mutateAsync(id);
      if (result && typeof result === 'object' && 'error' in result && (result as { error?: unknown }).error) {
        handleApiError((result as { error?: unknown }).error, { defaultMessage: 'Failed to delete batch' });
        return;
      }
      refetch();
      handleApiSuccess('Batch deleted successfully');
    } catch (err) {
      handleApiError(err, { defaultMessage: 'Failed to delete batch' });
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Batches</h1>
        <Button onClick={() => { setEditingId(null); setDialogOpen(true); }}><IconFilePlus />Add Batch</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Select value={productId} onValueChange={(v) => setProductId(v || '')}>
          <SelectTrigger><SelectValue placeholder="All products" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All products</SelectItem>
            {products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={supplierId} onValueChange={(v) => setSupplierId(v || '')}>
          <SelectTrigger><SelectValue placeholder="All suppliers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All suppliers</SelectItem>
            {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={expiredOnly} onValueChange={(v) => setExpiredOnly(v || 'all')}>
          <SelectTrigger><SelectValue placeholder="Expiry filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="false">Non-expired</SelectItem>
            <SelectItem value="true">Expired only</SelectItem>
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
                <TableHead>Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Purchase</TableHead>
                <TableHead className="text-right">Selling</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow key={b.id} className={new Date(b.expiryDate) < new Date() ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                  <TableCell className="font-medium">{b.batchNumber}</TableCell>
                  <TableCell>{b.product?.name}</TableCell>
                  <TableCell>{b.supplier?.name}</TableCell>
                  <TableCell>{new Date(b.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{b.quantity}</TableCell>
                  <TableCell className="text-right">{Number(b.purchasePrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(b.sellingPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label="Edit" variant="outline" size="sm" onClick={() => { setEditingId(b.id); setDialogOpen(true); }}>
                            <IconPencil />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label="Delete" variant="destructive" size="sm" onClick={() => handleDelete(b.id)} disabled={deleteMutation.isPending}>
                            <IconTrash />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Batch' : 'Add Batch'}</DialogTitle>
          </DialogHeader>
          <BatchForm
            batch={editingId ? (batches.find((b) => b.id === editingId) ?? null) : null}
            onSuccess={() => { resetModal(); refetch(); }}
            onCancel={() => resetModal()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}



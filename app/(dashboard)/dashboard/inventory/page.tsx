"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Product } from '@/types/product';
import { useDeleteProduct, useProduct, useProducts } from '@/hooks/useProducts';
// import { productService } from '@/services/productService';
import { productImportService } from '@/services/productImportService';
import { ProductForm } from '@/components/ProductForm';

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const { products, total, loading, error, refetch } = useProducts(page, limit, { search, sortBy, sortOrder });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewQuery = useProduct(viewId ?? undefined);

  const deleteMutation = useDeleteProduct();

  const canNext = useMemo(() => ((page - 1) * limit + products.length) < total, [page, limit, products.length, total]);

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
      toast.success('Product deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product';
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
        <h1 className="text-xl font-semibold">Products</h1>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Input placeholder="Search..." className="w-full min-w-0 sm:w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="genericName">Generic</SelectItem>
              <SelectItem value="purchasePrice">Purchase Price</SelectItem>
              <SelectItem value="sellingPrice">Selling Price</SelectItem>
              <SelectItem value="quantity">Quantity</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="createdAt">Created</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'ASC' | 'DESC')}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASC">Asc</SelectItem>
              <SelectItem value="DESC">Desc</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button asChild>
              <a href="/dashboard/inventory/new">Add Product</a>
            </Button>
            <input
              id="product-import-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={async (e) => {
                const inputEl = e.currentTarget;
                const file = inputEl.files?.[0];
                if (!file) return;
                try {
                  if (!file.name.match(/\.(xlsx|xls)$/)) {
                    toast.error('Please select an Excel file (.xlsx or .xls)');
                    return;
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    toast.error('File size must be less than 10MB');
                    return;
                  }
                  const res = await productImportService.importProducts(file);
                  if (res.success > 0) {
                    toast.success(`Successfully imported ${res.success} products`);
                  }
                  if (res.failed > 0) {
                    toast.error(`Failed to import ${res.failed} products`);
                    console.error(res.errors);
                  }
                  refetch();
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Import failed';
                  toast.error(message);
                } finally {
                  inputEl.value = '';
                }
              }}
            />
            <Button variant="outline" onClick={() => document.getElementById('product-import-input')?.click()}>Import</Button>
            <Button variant="outline" onClick={async () => {
              try {
                const blob = await productImportService.downloadTemplate();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'product-import-template.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch {
                toast.error('Failed to download template');
              }
            }}>Template</Button>
          </div>
        </div>
      </div>

      {/* Edit dialog remains; create moved to dedicated page */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setFormError(null); setFormSubmitting(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : ''}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <>
              <ProductForm
                product={editing}
                onSuccess={onFormSuccess}
                onCancel={() => { setDialogOpen(false); setEditing(null); }}
                onErrorChange={setFormError}
                onSubmittingChange={setFormSubmitting}
                formId="product-form"
                hideActions
              />
              <DialogFooter>
                <div className="flex w-full items-center justify-between">
                  {formError ? <span className="text-xs text-red-600">{formError}</span> : <span />}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }}>Cancel</Button>
                    <Button type="submit" form="product-form" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : 'Update'}</Button>
                  </div>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Generic</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden lg:table-cell">Manufacturer</TableHead>
              <TableHead className="hidden lg:table-cell">UOM</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="hidden md:table-cell text-right">Buy</TableHead>
              <TableHead className="text-right">Sell</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell className="hidden md:table-cell">{p.genericName || '-'}</TableCell>
                <TableCell>{p.category?.name || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell">{p.manufacturer?.name || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell">{p.unitOfMeasure?.name || '-'}</TableCell>
                <TableCell className="text-right">{p.quantity}</TableCell>
                <TableCell className="hidden md:table-cell text-right">{Number.isFinite(Number(p.purchasePrice)) ? Number(p.purchasePrice).toFixed(2) : '-'}</TableCell>
                <TableCell className="text-right">{Number.isFinite(Number(p.sellingPrice)) ? Number(p.sellingPrice).toFixed(2) : '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{p.status}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button aria-label="View" variant="ghost" size="sm" onClick={() => { setViewId(p.id); setViewOpen(true); }}>
                          <IconEye />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button aria-label="Edit" variant="outline" size="sm" onClick={() => { setEditing(p); setDialogOpen(true); }}>
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
                          <AlertDialogTitle>Delete product?</AlertDialogTitle>
                        </AlertHeader>
                        <AlertDesc>
                          This action will permanently delete <span className="font-medium">{p.name}</span>. This cannot be undone.
                        </AlertDesc>
                        <AlertFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(p.id)} disabled={deleteMutation.isPending}>Delete</AlertDialogAction>
                        </AlertFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + products.length} of {total}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>Next</Button>
        </div>
      </div>

      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) setViewId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            {viewQuery.data?.id ? (
              <DialogDescription>ID: {viewQuery.data.id}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="space-y-3">
            {viewQuery.isLoading ? (
              <div>Loading…</div>
            ) : viewQuery.error ? (
              <div className="text-red-600 text-sm">{viewQuery.error instanceof Error ? viewQuery.error.message : 'Failed to load'}</div>
            ) : viewQuery.data ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="font-medium">{viewQuery.data.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Generic</div>
                    <div>{viewQuery.data.genericName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div>{viewQuery.data.type || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Category</div>
                    <div>{viewQuery.data.category?.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Manufacturer</div>
                    <div>{viewQuery.data.manufacturer?.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">UOM</div>
                    <div>{viewQuery.data.unitOfMeasure?.name}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Quantity</div>
                    <div>{viewQuery.data.quantity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Purchase</div>
                    <div>{Number.isFinite(Number(viewQuery.data.purchasePrice)) ? Number(viewQuery.data.purchasePrice).toFixed(2) : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Selling</div>
                    <div>{Number.isFinite(Number(viewQuery.data.sellingPrice)) ? Number(viewQuery.data.sellingPrice).toFixed(2) : '-'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Description</div>
                  <div>{viewQuery.data.description || '-'}</div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


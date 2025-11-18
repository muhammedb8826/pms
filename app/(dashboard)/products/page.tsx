'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import {
  IconDotsVertical,
  IconFileDownload,
  IconPencil,
  IconPlus,
  IconSettings,
  IconUpload,
} from '@tabler/icons-react';
import Image from 'next/image';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDesc,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter as DrawerFooterSection,
  DrawerHeader as DrawerHeaderSection,
  DrawerTitle,
} from '@/components/ui/drawer';
import { DashboardDataTable } from '@/components/dashboard-data-table';
import { useIsMobile } from '@/hooks/use-mobile';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import { useProducts, useProduct, useDeleteProduct } from '@/features/product/hooks/useProducts';
import {
  useImportProductsSimpleMutation,
  useLazyDownloadProductTemplateQuery,
} from '@/features/product/api/productApi';
import type { Product } from '@/features/product/types';

function resolveImageUrl(path?: string | null) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    try {
      const url = new URL(base);
      return `${url.origin}${path.startsWith('/') ? path : `/${path}`}`;
    } catch {
      // fall back to window origin
    }
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ProductsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const { products, total, loading, error, refetch } = useProducts(page, pageSize, {
    search,
    sortBy,
    sortOrder,
  });
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize) || 1), [total, pageSize]);

  const deleteMutation = useDeleteProduct();
  const [importProducts] = useImportProductsSimpleMutation();
  const [downloadTemplate] = useLazyDownloadProductTemplateQuery();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewQuery = useProduct(viewId ?? undefined);

  const handleView = useCallback((product: Product) => {
    setViewId(product.id);
    setViewOpen(true);
  }, []);

  const handleEdit = useCallback(
    (product: Product) => {
      router.push(`/products/${product.id}/edit`);
    },
    [router],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const result = await deleteMutation.mutateAsync(id);
        if (result && typeof result === 'object' && 'error' in result && result.error) {
          handleApiError(result.error, { defaultMessage: 'Failed to delete product' });
          return;
        }
        refetch();
        handleApiSuccess('Product deleted successfully');
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to delete product' });
      }
    },
    [deleteMutation, refetch],
  );

  const columns = useMemo<ColumnDef<Product>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => handleView(product)}
                className="text-sm font-semibold text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {product.name}
              </button>
              {product.genericName ? (
                <span className="text-xs text-muted-foreground">{product.genericName}</span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.category?.name ?? '—'}</span>,
      },
      {
        accessorKey: 'manufacturer',
        header: 'Manufacturer',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.manufacturer?.name ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'defaultUom',
        header: 'Default UOM',
        cell: ({ row }) => {
          const uom = row.original.defaultUom;
          if (!uom) return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <span className="text-sm text-muted-foreground">
              {uom.name}
              {uom.abbreviation ? ` (${uom.abbreviation})` : ''}
            </span>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row }) => <div className="text-right text-sm font-medium tabular-nums">{row.original.quantity}</div>,
      },
      {
        accessorKey: 'purchasePrice',
        header: () => <div className="hidden text-right lg:block">Buy</div>,
        cell: ({ row }) => (
          <div className="hidden text-right text-sm text-muted-foreground tabular-nums lg:block">
            {currencyFormatter.format(Number(row.original.purchasePrice ?? 0))}
          </div>
        ),
      },
      {
        accessorKey: 'sellingPrice',
        header: () => <div className="text-right">Sell</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            {currencyFormatter.format(Number(row.original.sellingPrice ?? 0))}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.status?.toLowerCase() === 'active' ? 'default' : 'outline'}>
            {row.original.status ?? '—'}
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
          const product = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open product actions"
                  >
                    <IconDotsVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleView(product);
                    }}
                  >
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleEdit(product);
                    }}
                  >
                    Edit product
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(event) => event.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete product
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertHeader>
                        <AlertDialogTitle>Delete product?</AlertDialogTitle>
                      </AlertHeader>
                      <AlertDesc>
                        This action will permanently delete <span className="font-medium">{product.name}</span>. This
                        cannot be undone.
                      </AlertDesc>
                      <AlertFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(product.id)} disabled={deleteMutation.isPending}>
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
    ];
  }, [handleEdit, handleView, handleDelete, deleteMutation.isPending]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      try {
        if (!/\.(xlsx|xls)$/i.test(file.name)) {
          toast.error('Please select an Excel file (.xlsx or .xls)');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File size must be less than 10MB');
          return;
        }
        const result = await importProducts(file).unwrap();
        if (result.success > 0) {
          toast.success(`Imported ${result.success} products`);
        }
        if (result.failed > 0) {
          toast.error(`Failed to import ${result.failed} products`);
        }
        refetch();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Import failed';
        toast.error(message);
      } finally {
        event.currentTarget.value = '';
      }
    },
    [importProducts, refetch],
  );

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const { data: blob } = await downloadTemplate();
      if (!blob) {
        toast.error('Template not available');
        return;
      }
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
  }, [downloadTemplate]);

  const renderDetails = useCallback((product: Product) => {
    return (
      <div className="space-y-6">
        {product.image ? (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-2 text-xs text-muted-foreground">Product image</div>
            <div className="relative aspect-square w-full overflow-hidden rounded-md bg-background">
              <Image
                fill
                src={resolveImageUrl(product.image)}
                alt={product.name}
                className="object-contain"
              />
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Category</div>
            <div className="font-medium text-foreground">{product.category?.name ?? '—'}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Manufacturer</div>
              <div className="font-medium text-foreground">{product.manufacturer?.name ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Default UOM</div>
              <div className="font-medium text-foreground">
                {product.defaultUom
                  ? `${product.defaultUom.name}${product.defaultUom.abbreviation ? ` (${product.defaultUom.abbreviation})` : ''}`
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Quantity</div>
              <div className="font-medium tabular-nums">{product.quantity}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Min level</div>
              <div className="font-medium tabular-nums">{product.minLevel ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Purchase price</div>
              <div className="font-medium tabular-nums">
                {currencyFormatter.format(Number(product.purchasePrice ?? 0))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Selling price</div>
              <div className="font-medium tabular-nums">
                {currencyFormatter.format(Number(product.sellingPrice ?? 0))}
              </div>
            </div>
          </div>
          {product.description ? (
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Description</div>
              <p className="whitespace-pre-wrap text-foreground">{product.description}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }, []);

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Products</h1>
            <p className="text-sm text-muted-foreground">Manage your product catalogue, pricing, and availability.</p>
            <p className="mt-1 text-xs text-muted-foreground">Total products: {total}</p>
          </div>
          <Button onClick={() => router.push('/products/new')}>
            <IconPlus className="mr-2 size-4" />
            Add Product
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={products}
          loading={loading}
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
          emptyMessage="No products found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(product) => product.name}
          detailsDescription={(product) => product.genericName || ''}
          headerFilters={
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search products..."
                className="w-full min-w-0 sm:w-56"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value || 'name');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="genericName">Generic</SelectItem>
                  <SelectItem value="purchasePrice">Purchase price</SelectItem>
                  <SelectItem value="sellingPrice">Selling price</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="createdAt">Created</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value) => {
                  const next = (value?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';
                  setSortOrder(next);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">Ascending</SelectItem>
                  <SelectItem value="DESC">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          headerActions={
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportChange} />
              <Button variant="outline" onClick={handleImportClick}>
                <IconUpload className="mr-2 size-4" />
                Import
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <IconFileDownload className="mr-2 size-4" />
                Template
              </Button>
            </div>
          }
        />
      </div>

      <Drawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) {
            setViewId(null);
          }
        }}
        direction={isMobile ? 'bottom' : 'right'}
      >
        <DrawerContent className="max-h-[95vh] sm:max-w-lg">
          <DrawerHeaderSection className="gap-1">
            <DrawerTitle>{viewQuery.data?.name ?? 'Product details'}</DrawerTitle>
            {viewQuery.data?.genericName ? (
              <DrawerDescription>{viewQuery.data.genericName}</DrawerDescription>
            ) : null}
          </DrawerHeaderSection>
          <div className="space-y-6 px-4 pb-4">
            {viewQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : viewQuery.error ? (
              <div className="text-sm text-destructive">
                {viewQuery.error instanceof Error ? viewQuery.error.message : 'Failed to load product'}
              </div>
            ) : viewQuery.data ? (
              <>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 text-xs text-muted-foreground">Product image</div>
                  {viewQuery.data.image ? (
                    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-background">
                      <Image
                        fill
                        src={resolveImageUrl(viewQuery.data.image)}
                        alt={viewQuery.data.name}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-md border bg-background text-sm text-muted-foreground">
                      No image available
                    </div>
                  )}
                </div>

                <div className="grid gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Category</div>
                    <div className="font-medium text-foreground">{viewQuery.data.category?.name ?? '—'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Manufacturer</div>
                      <div className="font-medium text-foreground">
                        {viewQuery.data.manufacturer?.name ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Default UOM</div>
                      <div className="font-medium text-foreground">
                        {viewQuery.data.defaultUom
                          ? `${viewQuery.data.defaultUom.name}${
                              viewQuery.data.defaultUom.abbreviation
                                ? ` (${viewQuery.data.defaultUom.abbreviation})`
                                : ''
                            }`
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Quantity</div>
                      <div className="font-medium tabular-nums">{viewQuery.data.quantity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Min level</div>
                      <div className="font-medium tabular-nums">{viewQuery.data.minLevel ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Purchase price</div>
                      <div className="font-medium tabular-nums">
                        {currencyFormatter.format(Number(viewQuery.data.purchasePrice ?? 0))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Selling price</div>
                      <div className="font-medium tabular-nums">
                        {currencyFormatter.format(Number(viewQuery.data.sellingPrice ?? 0))}
                      </div>
                    </div>
                  </div>
                  {viewQuery.data.description ? (
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">Description</div>
                      <p className="whitespace-pre-wrap text-foreground">{viewQuery.data.description}</p>
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    <div>
                      <span className="text-muted-foreground">Status: </span>
                      <Badge variant={viewQuery.data.status?.toLowerCase() === 'active' ? 'default' : 'outline'}>
                        {viewQuery.data.status ?? '—'}
                      </Badge>
                    </div>
                    {viewQuery.data.createdAt ? (
                      <div>
                        <span className="text-muted-foreground">Created: </span>
                        {new Date(viewQuery.data.createdAt).toLocaleString()}
                      </div>
                    ) : null}
                    {viewQuery.data.updatedAt ? (
                      <div>
                        <span className="text-muted-foreground">Updated: </span>
                        {new Date(viewQuery.data.updatedAt).toLocaleString()}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No product details available.</div>
            )}
          </div>
          <DrawerFooterSection>
            {viewQuery.data ? (
              <Button
                variant="outline"
                onClick={() => {
                  setViewOpen(false);
                  router.push(`/products/${viewQuery.data?.id}/edit`);
                }}
              >
                <IconPencil className="mr-2 size-4" />
                Edit product
              </Button>
            ) : null}
            <DrawerClose asChild>
              <Button variant="secondary">Close</Button>
            </DrawerClose>
          </DrawerFooterSection>
        </DrawerContent>
      </Drawer>
    </div>
  );
}


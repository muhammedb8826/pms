"use client";

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { IconDotsVertical, IconFilePlus, IconPencil, IconSettings, IconTrash } from '@tabler/icons-react';
import { PurchaseStatus } from '@/features/purchase/types';
import { usePurchases, useDeletePurchase } from '@/features/purchase/hooks/usePurchases';
import { useAllSuppliers } from '@/features/supplier/hooks/useSuppliers';
import type { Supplier } from '@/features/supplier/types';
import type { Purchase } from '@/features/purchase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardDataTable } from '@/components/dashboard-data-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'ETB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const getStatusBadgeVariant = (status: PurchaseStatus) => {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'PARTIALLY_RECEIVED':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    case 'PENDING':
    default:
      return 'outline';
  }
};

export default function Page() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const { purchases, total, loading, error, refetch } = usePurchases(page, pageSize, {
    search, 
    supplierId: supplierId || undefined,
    status: status || undefined,
    sortBy, 
    sortOrder,
  });
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

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize) || 1), [total, pageSize]);


  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id).unwrap();
        handleApiSuccess('Purchase deleted successfully');
        refetch();
      } catch (err) {
        // Don't show success toast if there's an error
        handleApiError(err, { defaultMessage: 'Failed to delete purchase' });
      }
    },
    [deleteMutation, refetch],
  );

  const handleEdit = useCallback(
    (purchase: Purchase) => {
      router.push(`/purchases/${purchase.id}/edit`);
    },
    [router],
  );

  const renderDetails = useCallback((purchase: Purchase) => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Invoice No</div>
            <div className="font-medium text-foreground">{purchase.invoiceNo}</div>
          </div>
          {purchase.supplier && (
            <div>
              <div className="text-xs text-muted-foreground">Supplier</div>
              <div className="font-medium text-foreground">{purchase.supplier.name}</div>
              {purchase.supplier.contact && (
                <div className="text-xs text-muted-foreground mt-1">{purchase.supplier.contact}</div>
              )}
              {purchase.supplier.email && (
                <div className="text-xs text-muted-foreground">{purchase.supplier.email}</div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Date</div>
              <div className="font-medium text-foreground">
                {purchase.date ? dateFormatter.format(new Date(purchase.date)) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-1">
                <Badge variant={getStatusBadgeVariant(purchase.status)}>{purchase.status}</Badge>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Amount</div>
              <div className="font-semibold text-foreground">
                {currencyFormatter.format(Number(purchase.totalAmount))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Items</div>
              <div className="font-medium text-foreground">{purchase.items?.length || 0}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Paid Amount</div>
              <div className="font-medium text-foreground">
                {purchase.paidAmount !== undefined && purchase.paidAmount !== null
                  ? currencyFormatter.format(Number(purchase.paidAmount))
                  : currencyFormatter.format(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Balance</div>
              <div className={`font-medium ${(purchase.totalAmount - (purchase.paidAmount || 0)) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {currencyFormatter.format(Number(purchase.totalAmount - (purchase.paidAmount || 0)))}
              </div>
            </div>
            {purchase.paymentMethod && (
              <div>
                <div className="text-xs text-muted-foreground">Payment Method</div>
                <div className="mt-1">
                  <Badge variant="outline">{purchase.paymentMethod.name}</Badge>
                </div>
              </div>
            )}
          </div>
          {purchase.notes && (
            <div>
              <div className="text-xs text-muted-foreground">Notes</div>
              <div className="text-foreground">{purchase.notes}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <div>Created</div>
              <div>
                {purchase.createdAt ? dateFormatter.format(new Date(purchase.createdAt)) : '—'}
              </div>
            </div>
            <div>
              <div>Updated</div>
              <div>
                {purchase.updatedAt ? dateFormatter.format(new Date(purchase.updatedAt)) : '—'}
              </div>
            </div>
          </div>
        </div>
        {purchase.items && purchase.items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Items ({purchase.items.length})</span>
              <Badge variant="outline">{purchase.items.length}</Badge>
            </div>
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
                  {purchase.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product?.name || '—'}</TableCell>
                      <TableCell>
                        {item.uom
                          ? `${item.uom.name}${item.uom.abbreviation ? ` (${item.uom.abbreviation})` : ''}`
                          : '—'}
                      </TableCell>
                      <TableCell>{item.batchNumber || '—'}</TableCell>
                      <TableCell>
                        {item.expiryDate ? dateFormatter.format(new Date(item.expiryDate)) : '—'}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {currencyFormatter.format(Number(item.unitCost))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {currencyFormatter.format(Number(item.totalCost))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<Purchase>[]>(
    () => [
      {
        accessorKey: 'invoiceNo',
        header: 'Invoice No',
        cell: ({ row }) => (
          <span className="text-sm font-semibold">{row.original.invoiceNo}</span>
        ),
      },
      {
        accessorKey: 'supplier',
        header: 'Supplier',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.supplier?.name || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.date ? dateFormatter.format(new Date(row.original.date)) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: () => <div className="text-right">Total Amount</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            {currencyFormatter.format(Number(row.original.totalAmount))}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={getStatusBadgeVariant(row.original.status)}>{row.original.status}</Badge>
        ),
      },
      {
        accessorKey: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.items?.length || 0}</span>
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        header: () => (
          <div className="flex justify-end text-muted-foreground">
            <IconSettings className="size-4" aria-hidden />
          </div>
        ),
        cell: ({ row }) => {
          const purchase = row.original;
          const canEdit = purchase.status !== 'COMPLETED' && purchase.status !== 'CANCELLED';
          const canDelete = purchase.status !== 'COMPLETED';
          
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open purchase actions"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconDotsVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleEdit(purchase);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    disabled={!canEdit}
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {canDelete ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(event) => event.preventDefault()}
                          className="text-destructive focus:text-destructive"
                        >
                          <IconTrash className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertHeader>
                          <AlertDialogTitle>Delete purchase?</AlertDialogTitle>
                          <AlertDesc>
                            This action will permanently delete purchase{' '}
                            <span className="font-medium">{purchase.invoiceNo}</span>. This cannot be undone.
                            <br />
                            <br />
                            <span className="text-sm text-muted-foreground">
                              Note: Purchases with payments cannot be deleted. Cancel the purchase instead, or delete payments first via payment history.
                            </span>
                          </AlertDesc>
                        </AlertHeader>
                        <AlertFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              if (purchase.id) {
                                void handleDelete(purchase.id);
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <DropdownMenuItem disabled className="text-destructive focus:text-destructive">
                      <IconTrash className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [handleEdit, handleDelete, deleteMutation.isPending],
  );

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
          <div>
        <h1 className="text-xl font-semibold">Purchases</h1>
            <p className="text-sm text-muted-foreground">Manage purchase orders and invoices</p>
            <p className="mt-1 text-xs text-muted-foreground">Total purchases: {total}</p>
          </div>
          <Button onClick={() => router.push('/purchases/new')}>
            <IconFilePlus className="mr-2 size-4" />
            Add Purchase
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={purchases}
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
          emptyMessage="No purchases found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(purchase) => `Purchase: ${purchase.invoiceNo}`}
          detailsDescription={(purchase) => purchase.supplier?.name || ''}
          renderDetailsFooter={(purchase, onClose) => {
            const canEdit = purchase.status !== 'COMPLETED' && purchase.status !== 'CANCELLED';
            return (
              <>
                {canEdit && (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onClose();
                      setTimeout(() => {
                        handleEdit(purchase);
                      }, 0);
                    }}
                    className="w-full"
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit Purchase
                  </Button>
                )}
              </>
            );
          }}
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
              <Select
                value={supplierId || '__all__'}
                onValueChange={(v) => {
                  setSupplierId(v === '__all__' ? '' : v || '');
                  setPage(1);
                }}
              >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="__all__">All Suppliers</SelectItem>
              {allSuppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
              ))}
            </SelectContent>
          </Select>
              <Select
                value={status || '__all__'}
                onValueChange={(v) => {
                  setStatus(v === '__all__' ? '' : v || '');
                  setPage(1);
                }}
              >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="COMPLETED">COMPLETED</SelectItem>
              <SelectItem value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</SelectItem>
              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
          </Select>
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v || 'date');
                  setPage(1);
                }}
              >
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
              <Select
                value={sortOrder}
                onValueChange={(v) => {
                  setSortOrder((v || 'DESC') as 'ASC' | 'DESC');
                  setPage(1);
                }}
              >
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

    </div>
  );
}

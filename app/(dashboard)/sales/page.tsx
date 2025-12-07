"use client";

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import {
  IconDotsVertical,
  IconFilePlus,
  IconPencil,
  IconPrinter,
  IconSettings,
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DashboardDataTable } from '@/components/dashboard-data-table';
import { useSales, useDeleteSale } from '@/features/sale/hooks/useSales';
import { useAllCustomers } from '@/features/customer/hooks/useCustomers';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import type { Sale, SaleStatus } from '@/features/sale/types';
import type { Customer } from '@/features/customer/types';

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'ETB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export default function SalesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState<string>('');

  const statusFilter = status ? (status as SaleStatus) : undefined;
  const { sales: rawSales, total, loading, error, refetch } = useSales({
    page,
    limit: pageSize,
    search: search || undefined,
    customerId: customerId || undefined,
    status: statusFilter,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const sales = useMemo(() => Array.isArray(rawSales) ? rawSales : [], [rawSales]);

  const allCustomersQuery = useAllCustomers();
  const customers = useMemo(() => {
    type WrappedResponse<T> = { success: boolean; data: T };
    const data = allCustomersQuery.data as Customer[] | WrappedResponse<Customer[]> | undefined;
    if (!data) return [] as Customer[];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Customer[];
  }, [allCustomersQuery.data]);

  const [deleteSale, deleteResult] = useDeleteSale();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pageCount = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize) || 1), [total, pageSize]);

  const handleEdit = useCallback((sale: Sale) => {
    router.push(`/sales/${sale.id}/edit`);
  }, [router]);

  const handleViewVoucher = useCallback((sale: Sale) => {
    router.push(`/sales/${sale.id}/voucher`);
  }, [router]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteSale(id).unwrap();
        handleApiSuccess('Sale deleted');
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to delete sale' });
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteSale, refetch],
  );

  const getStatusBadgeVariant = (status: SaleStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const renderDetails = useCallback((sale: Sale) => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Customer</div>
            <div className="font-medium text-foreground">{sale.customer?.name || '—'}</div>
            {sale.customer?.phone && (
              <div className="text-xs text-muted-foreground mt-1">Phone: {sale.customer.phone}</div>
            )}
            {sale.customer?.email && (
              <div className="text-xs text-muted-foreground">Email: {sale.customer.email}</div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date</div>
            <div className="text-foreground">
              {sale.date ? dateFormatter.format(new Date(sale.date)) : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Amount</div>
            <div className="font-medium text-foreground">
              {currencyFormatter.format(Number(sale.totalAmount))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="mt-1">
              <Badge variant={getStatusBadgeVariant(sale.status)}>{sale.status}</Badge>
            </div>
          </div>
          {sale.notes && (
            <div>
              <div className="text-xs text-muted-foreground">Notes</div>
              <div className="text-foreground">{sale.notes}</div>
            </div>
          )}
          {sale.createdAt && (
            <div>
              <div className="text-xs text-muted-foreground">Created</div>
              <div className="text-foreground">
                {dateFormatter.format(new Date(sale.createdAt))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Items ({sale.items?.length ?? 0})
            </span>
            <Badge variant="outline">{sale.items?.length ?? 0}</Badge>
          </div>
          {sale.items && sale.items.length > 0 ? (
            <ul className="grid gap-3 rounded-lg border bg-background p-3 text-sm">
              {sale.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-foreground">{item.product?.name || '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      Batch: {item.batch?.batchNumber || '—'} • Qty: {item.quantity} • Price: {currencyFormatter.format(item.unitPrice)}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                    )}
                  </div>
                  <div className="text-right font-medium">
                    {currencyFormatter.format(item.totalPrice)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No items in this sale.
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<Sale>[]>(() => {
    return [
      {
        accessorKey: 'customer',
        header: 'Customer',
        cell: ({ row }) => (
          <span className="text-sm font-semibold">
            {row.original.customer?.name || '—'}
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
        header: () => <div className="text-right">Total</div>,
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
          <Badge variant={getStatusBadgeVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'items',
        header: () => <div className="text-right">Items</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm tabular-nums">
            {Array.isArray(row.original.items) ? row.original.items.length : 0}
          </div>
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
          const sale = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open sale actions"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconDotsVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleEdit(sale);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit sale
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleViewVoucher(sale);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconPrinter className="mr-2 size-4" />
                    Print Voucher
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setConfirmDeleteId(sale.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete sale
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [handleEdit, handleViewVoucher]);

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error instanceof Error ? error.message : 'Failed to load sales'}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Sales</h1>
            <p className="text-sm text-muted-foreground">Manage sales records</p>
            <p className="mt-1 text-xs text-muted-foreground">Total sales: {total || 0}</p>
          </div>
          <Link href="/sales/new">
            <Button>
              <IconFilePlus className="mr-2 size-4" />
              New Sale
            </Button>
          </Link>
        </div>

        <DashboardDataTable
          columns={columns}
          data={sales}
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
          emptyMessage="No sales found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(sale) => `Sale #${sale.id.slice(0, 8)}`}
          detailsDescription={(sale) => sale.customer?.name || ''}
          renderDetailsFooter={(sale, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  router.push(`/sales/${sale.id}/edit`);
                }, 0);
              }}
              className="w-full"
            >
              <IconPencil className="mr-2 size-4" />
              Edit Sale
            </Button>
          )}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search by customer or notes"
                className="w-full min-w-0 sm:w-56"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={customerId}
                onValueChange={(v) => {
                  setCustomerId(v || '');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All customers</SelectItem>
                  {customers.map((c: Customer) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v || '');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All status</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

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
            <AlertDialogTitle>Delete sale?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this sale record. This cannot be undone.
            <br />
            <br />
            <span className="text-sm text-muted-foreground">
              Note: Sales with payments cannot be deleted. Cancel the sale instead, or delete payments first via payment history.
            </span>
          </AlertDesc>
          <AlertFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) {
                  void handleDelete(confirmDeleteId);
                }
              }}
              disabled={deleteResult.isLoading}
            >
              Delete
            </AlertDialogAction>
          </AlertFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

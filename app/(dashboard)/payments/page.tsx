"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DashboardDataTable } from "@/components/dashboard-data-table";
import { usePayments, usePaymentStatistics, getPaymentType, getPaymentSource, canDeletePayment, getPaymentDeleteRestriction } from "@/features/payment/hooks/usePayments";
import { useDeletePaymentMutation } from "@/features/payment/api/paymentApi";
import type { Payment } from "@/features/payment/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDesc,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const getPaymentMethodLabel = (payment: Payment): string => {
  if (payment.paymentMethod?.name) {
    return payment.paymentMethod.name;
  }
  // Fallback for legacy data or missing payment method
  if (payment.paymentMethodId) {
    return 'Unknown Method';
  }
  return '—';
};

const getPaymentTypeBadgeVariant = (type: 'PURCHASE' | 'SALE' | 'CREDIT') => {
  switch (type) {
    case 'PURCHASE':
      return 'secondary';
    case 'SALE':
      return 'default';
    case 'CREDIT':
      return 'outline';
    default:
      return 'outline';
  }
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'paymentDate' | 'amount' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    page,
    limit: pageSize,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy,
    sortOrder,
  }), [page, pageSize, startDate, endDate, sortBy, sortOrder]);

  const { payments, total, loading, error, refetch } = usePayments(filters);
  const { data: statistics } = usePaymentStatistics({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const [deletePaymentMutation, deleteResult] = useDeletePaymentMutation();

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize) || 1), [total, pageSize]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  // Set default date range to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deletePaymentMutation(id).unwrap();
        handleApiSuccess('Payment deleted successfully');
        refetch();
        setConfirmDeleteId(null);
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to delete payment' });
      }
    },
    [deletePaymentMutation, refetch],
  );

  const renderDetails = useCallback((payment: Payment) => {
    const paymentType = getPaymentType(payment);
    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Amount</div>
            <div className="font-medium text-foreground">
              {currencyFormatter.format(Number(payment.amount))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Payment Method</div>
            <div className="text-foreground">
              {getPaymentMethodLabel(payment)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Payment Date</div>
            <div className="text-foreground">
              {payment.paymentDate
                ? dateFormatter.format(new Date(payment.paymentDate))
                : "—"}
            </div>
          </div>
          {payment.referenceNumber && (
            <div>
              <div className="text-xs text-muted-foreground">Reference Number</div>
              <div className="text-foreground">{payment.referenceNumber}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-muted-foreground">Type</div>
            <Badge variant={getPaymentTypeBadgeVariant(paymentType)}>
              {paymentType}
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Source</div>
            <div className="text-foreground">{getPaymentSource(payment)}</div>
          </div>
          {payment.notes && (
            <div>
              <div className="text-xs text-muted-foreground">Notes</div>
              <div className="text-foreground">{payment.notes}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-foreground">
              {payment.createdAt
                ? dateFormatter.format(new Date(payment.createdAt))
                : "—"}
            </div>
          </div>
        </div>
        {payment.purchase && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="font-semibold mb-2">Purchase Details</div>
            <div className="space-y-1">
              <div>Invoice: {payment.purchase.invoiceNo}</div>
              {payment.purchase.supplier && (
                <div>Supplier: {payment.purchase.supplier.name}</div>
              )}
              <div>Total: {currencyFormatter.format(Number(payment.purchase.totalAmount))}</div>
              <div>Paid: {currencyFormatter.format(Number(payment.purchase.paidAmount))}</div>
            </div>
          </div>
        )}
        {payment.sale && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="font-semibold mb-2">Sale Details</div>
            <div className="space-y-1">
              {payment.sale.customer && (
                <div>Customer: {payment.sale.customer.name}</div>
              )}
              <div>Total: {currencyFormatter.format(Number(payment.sale.totalAmount))}</div>
              <div>Paid: {currencyFormatter.format(Number(payment.sale.paidAmount))}</div>
            </div>
          </div>
        )}
        {payment.credit && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="font-semibold mb-2">Credit Details</div>
            <div className="space-y-1">
              <div>Type: {payment.credit.type}</div>
              <div>Status: {payment.credit.status}</div>
              <div>Total: {currencyFormatter.format(Number(payment.credit.totalAmount))}</div>
              <div>Paid: {currencyFormatter.format(Number(payment.credit.paidAmount))}</div>
              <div>Balance: {currencyFormatter.format(Number(payment.credit.balanceAmount))}</div>
            </div>
          </div>
        )}
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<Payment>[]>(() => {
    return [
      {
        accessorKey: "paymentDate",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.paymentDate
              ? dateFormatter.format(new Date(row.original.paymentDate))
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            {currencyFormatter.format(Number(row.original.amount))}
          </div>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment Method",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {getPaymentMethodLabel(row.original)}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = getPaymentType(row.original);
          return (
            <Badge variant={getPaymentTypeBadgeVariant(type)}>
              {type}
            </Badge>
          );
        },
      },
      {
        id: "source",
        header: "Source",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {getPaymentSource(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "referenceNumber",
        header: "Reference",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.referenceNumber || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="flex justify-end text-muted-foreground">
            <IconSettings className="size-4" aria-hidden />
          </div>
        ),
        cell: ({ row }) => {
          const payment = row.original;
          const canDelete = canDeletePayment(payment);
          const restrictionMessage = getPaymentDeleteRestriction(payment);
          
          return (
            <div 
              className="flex justify-end" 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open payment actions"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconDotsVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {canDelete ? (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        // Prevent row click by temporarily disabling pointer events on the row
                        const target = event.target as HTMLElement;
                        const row = target.closest('tr');
                        if (row) {
                          (row as HTMLElement).style.pointerEvents = 'none';
                          setTimeout(() => {
                            (row as HTMLElement).style.pointerEvents = '';
                          }, 100);
                        }
                        setConfirmDeleteId(payment.id);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Prevent row click by temporarily disabling pointer events on the row
                        const target = e.target as HTMLElement;
                        const row = target.closest('tr');
                        if (row) {
                          (row as HTMLElement).style.pointerEvents = 'none';
                          setTimeout(() => {
                            (row as HTMLElement).style.pointerEvents = '';
                          }, 100);
                        }
                        setConfirmDeleteId(payment.id);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Prevent row click early
                        const target = e.target as HTMLElement;
                        const row = target.closest('tr');
                        if (row) {
                          (row as HTMLElement).style.pointerEvents = 'none';
                          setTimeout(() => {
                            (row as HTMLElement).style.pointerEvents = '';
                          }, 100);
                        }
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <IconTrash className="mr-2 size-4" />
                      Delete payment
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      disabled
                      className="text-muted-foreground"
                      title={restrictionMessage || 'Cannot delete this payment'}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <IconTrash className="mr-2 size-4" />
                      Delete payment
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, []);

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Payment History</h1>
            <p className="text-sm text-muted-foreground">
              View all payments across purchases, sales, and credits.
            </p>
            {statistics && (
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>
                  Total Payments: <span className="font-medium">{statistics.totalPayments}</span>
                </span>
                <span>
                  Total Amount: <span className="font-medium">
                    {currencyFormatter.format(statistics.totalAmount)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        <DashboardDataTable
          columns={columns}
          data={payments}
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
          emptyMessage="No payments found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(payment) => `Payment ${payment.id.slice(0, 8)}`}
          detailsDescription={(payment) =>
            `${currencyFormatter.format(Number(payment.amount))} - ${getPaymentMethodLabel(payment)}`
          }
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                type="date"
                placeholder="Start Date"
                className="w-full min-w-0 sm:w-40"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                placeholder="End Date"
                className="w-full min-w-0 sm:w-40"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy((value || 'paymentDate') as 'paymentDate' | 'amount' | 'createdAt');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paymentDate">Payment Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="createdAt">Created</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value) => {
                  setSortOrder((value || 'DESC') as 'ASC' | 'DESC');
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
        />
      </div>

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertHeader>
            <AlertDialogTitle>Delete payment?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this payment record. This cannot be undone.
            <br />
            <br />
            <span className="font-semibold text-destructive">
              Deleting a payment will automatically update the related purchase, sale, or credit amounts.
            </span>
            <br />
            <br />
            <span className="text-sm text-muted-foreground">
              Note: Payments for completed purchases or sales, or fully paid credits cannot be deleted. Cancel the related transaction first if you need to modify payments.
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


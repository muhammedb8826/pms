"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconSettings,
  IconTrash,
  IconCurrencyDollar,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DashboardDataTable } from "@/components/dashboard-data-table";
import {
  useCommissions,
  usePayCommission,
  useDeleteCommission,
} from "@/features/commission/hooks/useCommissions";
import { useAllUsers } from "@/features/user/hooks/useUsers";
import type { Commission, CommissionFilters } from "@/features/commission/types";
import { CommissionStatus } from "@/features/commission/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";
import type { User } from "@/features/user/types";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const getStatusBadgeVariant = (status: CommissionStatus) => {
  switch (status) {
    case CommissionStatus.PENDING:
      return "secondary";
    case CommissionStatus.PAID:
      return "default";
    case CommissionStatus.CANCELLED:
      return "destructive";
    default:
      return "outline";
  }
};

export default function CommissionsPage() {

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | "all">("all");
  const [salespersonIdFilter, setSalespersonIdFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [payCommissionId, setPayCommissionId] = useState<string | null>(null);
  const [paidDate, setPaidDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  const filters = useMemo<CommissionFilters>(
    () => ({
      status: statusFilter !== "all" ? statusFilter : undefined,
      salespersonId: salespersonIdFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [statusFilter, salespersonIdFilter, startDate, endDate]
  );

  const { commissions, loading, error, refetch } = useCommissions(filters);
  const allUsersQuery = useAllUsers();
  const payMutation = usePayCommission();
  const deleteMutation = useDeleteCommission();

  const salespeople = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allUsersQuery.data as User[] | WR<User[]> | undefined;
    if (!data) return [] as User[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as User[];
  }, [allUsersQuery.data]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(commissions.length / pageSize) || 1), [
    commissions.length,
    pageSize,
  ]);
  const paginatedCommissions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return commissions.slice(start, start + pageSize);
  }, [commissions, page, pageSize]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const handlePayCommission = useCallback(
    async (id: string) => {
      try {
        await payMutation.mutateAsync({
          id,
          data: {
            paidDate: paidDate || undefined,
            notes: paymentNotes || undefined,
          },
        });
        handleApiSuccess("Commission marked as paid");
        setPayCommissionId(null);
        setPaidDate(new Date().toISOString().split("T")[0]);
        setPaymentNotes("");
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to pay commission" });
      }
    },
    [payMutation, paidDate, paymentNotes, refetch]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess("Commission deleted successfully");
        setConfirmDeleteId(null);
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to delete commission" });
      }
    },
    [deleteMutation, refetch]
  );

  const renderDetails = useCallback(
    (commission: Commission) => {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Salesperson</div>
              <div className="font-medium text-foreground">
                {commission.salesperson.firstName} {commission.salesperson.lastName}
              </div>
              <div className="text-xs text-muted-foreground">{commission.salesperson.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Sale Amount</div>
              <div className="font-medium text-foreground tabular-nums">
                {currencyFormatter.format(commission.saleAmount)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Commission Rate</div>
                <div className="font-medium text-foreground">{commission.commissionRate}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Commission Amount</div>
                <div className="font-medium text-foreground tabular-nums">
                  {currencyFormatter.format(commission.commissionAmount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div>
                  <Badge variant={getStatusBadgeVariant(commission.status)} className="text-xs uppercase">
                    {commission.status}
                  </Badge>
                </div>
              </div>
              {commission.paidDate && (
                <div>
                  <div className="text-xs text-muted-foreground">Paid Date</div>
                  <div className="font-medium text-foreground">
                    {dateFormatter.format(new Date(commission.paidDate))}
                  </div>
                </div>
              )}
            </div>
            {commission.notes && (
              <div>
                <div className="text-xs text-muted-foreground">Notes</div>
                <div className="text-foreground">{commission.notes}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Sale</div>
              <div className="font-medium text-foreground">
                Sale #{commission.sale.id.slice(0, 8)} - {commission.sale.customer?.name || "Unknown Customer"}
              </div>
              <div className="text-xs text-muted-foreground">
                {dateFormatter.format(new Date(commission.sale.date))} -{" "}
                {currencyFormatter.format(commission.sale.totalAmount)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="font-medium text-foreground">
                  {dateFormatter.format(new Date(commission.createdAt))}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Last Updated</div>
                <div className="font-medium text-foreground">
                  {dateFormatter.format(new Date(commission.updatedAt))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
    []
  );

  const columns = useMemo<ColumnDef<Commission>[]>(() => {
    return [
      {
        accessorKey: "salesperson",
        header: "Salesperson",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {row.original.salesperson.firstName} {row.original.salesperson.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{row.original.salesperson.email}</span>
          </div>
        ),
      },
      {
        accessorKey: "sale",
        header: "Sale",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              #{row.original.sale.id.slice(0, 8)}
            </span>
            <span className="text-xs text-muted-foreground">
              {dateFormatter.format(new Date(row.original.sale.date))}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "saleAmount",
        header: () => <div className="text-right">Sale Amount</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            {currencyFormatter.format(row.original.saleAmount)}
          </div>
        ),
      },
      {
        accessorKey: "commissionRate",
        header: () => <div className="text-right">Rate</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm text-muted-foreground">{row.original.commissionRate}%</div>
        ),
      },
      {
        accessorKey: "commissionAmount",
        header: () => <div className="text-right">Commission</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-semibold tabular-nums">
            {currencyFormatter.format(row.original.commissionAmount)}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={getStatusBadgeVariant(row.original.status)} className="text-xs uppercase">
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "paidDate",
        header: () => <div className="hidden text-right lg:block">Paid Date</div>,
        cell: ({ row }) => (
          <div className="hidden text-right text-sm text-muted-foreground lg:block">
            {row.original.paidDate ? dateFormatter.format(new Date(row.original.paidDate)) : "—"}
          </div>
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
          const commission = row.original;
          const canPay = commission.status === CommissionStatus.PENDING;
          const canDelete = commission.status === CommissionStatus.PENDING;
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
                    aria-label="Open commission actions"
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
                  {canPay && (
                    <>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setPayCommissionId(commission.id);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <IconCurrencyDollar className="mr-2 size-4" />
                        Mark as Paid
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const target = event.target as HTMLElement;
                          const row = target.closest("tr");
                          if (row) {
                            (row as HTMLElement).style.pointerEvents = "none";
                            setTimeout(() => {
                              (row as HTMLElement).style.pointerEvents = "";
                            }, 100);
                          }
                          setConfirmDeleteId(commission.id);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const target = e.target as HTMLElement;
                          const row = target.closest("tr");
                          if (row) {
                            (row as HTMLElement).style.pointerEvents = "none";
                            setTimeout(() => {
                              (row as HTMLElement).style.pointerEvents = "";
                            }, 100);
                          }
                          setConfirmDeleteId(commission.id);
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <IconTrash className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
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
    return <div className="p-4 text-sm text-destructive">Error: {error instanceof Error ? error.message : "Failed to load commissions"}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Commissions</h1>
            <p className="text-sm text-muted-foreground">Track and manage salesperson commissions</p>
            <p className="mt-1 text-xs text-muted-foreground">Total commissions: {commissions.length}</p>
          </div>
        </div>

        <DashboardDataTable
          columns={columns}
          data={paginatedCommissions}
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
          emptyMessage="No commissions found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(commission) =>
            `Commission - ${commission.salesperson.firstName} ${commission.salesperson.lastName}`
          }
          detailsDescription={(commission) =>
            `${currencyFormatter.format(commission.commissionAmount)} (${commission.commissionRate}%)`
          }
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter((value as CommissionStatus | "all") || "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={CommissionStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={CommissionStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={CommissionStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={salespersonIdFilter || "__all__"}
                onValueChange={(value) => {
                  setSalespersonIdFilter(value === "__all__" ? "" : value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Salespeople" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Salespeople</SelectItem>
                  {salespeople.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Start date"
                className="w-full sm:w-40"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                placeholder="End date"
                className="w-full sm:w-40"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          }
        />
      </div>

      {/* Pay Commission Dialog */}
      <Dialog open={!!payCommissionId} onOpenChange={(open) => !open && setPayCommissionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Commission as Paid</DialogTitle>
            <DialogDescription>Enter payment details for this commission</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Paid Date</label>
              <Input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Notes (Optional)</label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g., Bank transfer, Check #123"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayCommissionId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (payCommissionId) {
                  void handlePayCommission(payCommissionId);
                }
              }}
              disabled={payMutation.isPending}
            >
              {payMutation.isPending ? "Processing..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Delete commission?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this commission record. This cannot be undone.
          </AlertDesc>
          <AlertFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) {
                  void handleDelete(confirmDeleteId);
                }
              }}
              disabled={deleteMutation.isPending}
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

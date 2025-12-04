"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconFilePlus,
  IconPencil,
  IconSettings,
  IconTrash,
  IconCurrencyDollar,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { FormDialog } from "@/components/form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DashboardDataTable } from "@/components/dashboard-data-table";
import { useCredits, useDeleteCredit } from "@/features/credit/hooks/useCredits";
import type { Credit, CreditStatus } from "@/features/credit/types";
import { CreditType as CreditTypeEnum, CreditStatus as CreditStatusEnum } from "@/features/credit/types";
import { CreditForm } from "@/features/credit/components/CreditForm";
import { PaymentForm } from "@/features/credit/components/PaymentForm";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const getStatusBadgeVariant = (status: CreditStatus) => {
  switch (status) {
    case CreditStatusEnum.PAID:
      return "default";
    case CreditStatusEnum.PARTIAL:
      return "secondary";
    case CreditStatusEnum.OVERDUE:
      return "destructive";
    case CreditStatusEnum.PENDING:
    default:
      return "outline";
  }
};

export default function CreditsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "payable" | "receivable">("all");
  const [statusFilter, setStatusFilter] = useState<CreditStatus | "">("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Determine type filter based on active tab
  const typeFilter = useMemo(() => {
    if (activeTab === "payable") return CreditTypeEnum.PAYABLE;
    if (activeTab === "receivable") return CreditTypeEnum.RECEIVABLE;
    return undefined;
  }, [activeTab]);

  const { credits, total, loading, error, refetch } = useCredits(page, pageSize, {
    type: typeFilter,
    status: statusFilter || undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  // Calculate tab badges - these would ideally come from separate queries
  const payableCount = useMemo(() => {
    return credits.filter((c) => c.type === CreditTypeEnum.PAYABLE).length;
  }, [credits]);

  const receivableCount = useMemo(() => {
    return credits.filter((c) => c.type === CreditTypeEnum.RECEIVABLE).length;
  }, [credits]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize) || 1), [total, pageSize]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Credit | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [, setFormSubmitting] = useState(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentCredit, setPaymentCredit] = useState<Credit | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteCredit();

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess("Credit deleted successfully");
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to delete credit" });
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteMutation, refetch],
  );

  const handleEdit = useCallback((credit: Credit) => {
    setEditing(credit);
    setDialogOpen(true);
  }, []);

  const handleRecordPayment = useCallback((credit: Credit) => {
    setPaymentCredit(credit);
    setPaymentDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
    setFormError(null);
  }, []);

  const handlePaymentDialogClose = useCallback(() => {
    setPaymentDialogOpen(false);
    setPaymentCredit(null);
    setFormError(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    handleDialogClose();
    refetch();
  }, [handleDialogClose, refetch]);

  const handlePaymentSuccess = useCallback(() => {
    handlePaymentDialogClose();
    refetch();
  }, [handlePaymentDialogClose, refetch]);

  const renderDetails = useCallback((credit: Credit) => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Type</div>
              <div className="mt-1">
                <Badge variant={credit.type === CreditTypeEnum.PAYABLE ? "secondary" : "outline"}>
                  {credit.type}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-1">
                <Badge variant={getStatusBadgeVariant(credit.status)}>{credit.status}</Badge>
              </div>
            </div>
          </div>
          {credit.supplier && (
            <div>
              <div className="text-xs text-muted-foreground">Supplier</div>
              <div className="font-medium text-foreground">{credit.supplier.name}</div>
            </div>
          )}
          {credit.customer && (
            <div>
              <div className="text-xs text-muted-foreground">Customer</div>
              <div className="font-medium text-foreground">{credit.customer.name}</div>
            </div>
          )}
          {credit.purchase && (
            <div>
              <div className="text-xs text-muted-foreground">Purchase</div>
              <div className="font-medium text-foreground">{credit.purchase.invoiceNo}</div>
            </div>
          )}
          {credit.sale && (
            <div>
              <div className="text-xs text-muted-foreground">Sale</div>
              <div className="font-medium text-foreground">{credit.sale.invoiceNo || credit.sale.id}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Total Amount</div>
              <div className="font-semibold text-foreground">
                {currencyFormatter.format(parseFloat(credit.totalAmount))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Paid Amount</div>
              <div className="font-semibold text-foreground">
                {currencyFormatter.format(parseFloat(credit.paidAmount))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Balance Amount</div>
              <div className="font-semibold text-destructive">
                {currencyFormatter.format(parseFloat(credit.balanceAmount))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Due Date</div>
              <div className="font-medium text-foreground">
                {credit.dueDate ? dateFormatter.format(new Date(credit.dueDate)) : "—"}
              </div>
            </div>
          </div>
          {credit.notes && (
            <div>
              <div className="text-xs text-muted-foreground">Notes</div>
              <div className="text-foreground">{credit.notes}</div>
            </div>
          )}
          {credit.payments && credit.payments.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Payment Methods Used</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  new Set(
                    credit.payments
                      .map((p) => {
                        // Handle both enum string and object formats
                        if (typeof p.paymentMethod === 'string') {
                          return p.paymentMethod;
                        }
                        if (p.paymentMethod && typeof p.paymentMethod === 'object' && 'name' in p.paymentMethod) {
                          return (p.paymentMethod as { name: string }).name;
                        }
                        return null;
                      })
                      .filter((method): method is string => method !== null && method !== undefined)
                  )
                ).map((method) => {
                  const methodPayments = credit.payments!.filter((p) => {
                    const pm = p.paymentMethod;
                    if (typeof pm === 'string') {
                      return pm === method;
                    }
                    if (pm && typeof pm === 'object' && 'name' in pm) {
                      return (pm as { name: string }).name === method;
                    }
                    return false;
                  });
                  const methodTotal = methodPayments.reduce(
                    (sum, p) => sum + parseFloat(p.amount),
                    0
                  );
                  const displayName = typeof method === 'string' ? method.replace(/_/g, " ") : method;
                  return (
                    <Badge key={method} variant="outline" className="text-xs">
                      {displayName}: {currencyFormatter.format(methodTotal)} ({methodPayments.length})
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <div>Created</div>
              <div>{dateFormatter.format(new Date(credit.createdAt))}</div>
            </div>
            <div>
              <div>Updated</div>
              <div>{dateFormatter.format(new Date(credit.updatedAt))}</div>
            </div>
          </div>
        </div>
        {credit.payments && credit.payments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Payment History ({credit.payments.length})</span>
              <Badge variant="outline">{credit.payments.length}</Badge>
            </div>
            <div className="border rounded-lg divide-y">
              {credit.payments.map((payment) => (
                <div key={payment.id} className="p-3 space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {currencyFormatter.format(parseFloat(payment.amount))}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {(() => {
                            const pm = payment.paymentMethod;
                            if (typeof pm === 'string') {
                              return pm.replace(/_/g, " ");
                            }
                            if (pm && typeof pm === 'object' && 'name' in pm) {
                              return (pm as { name: string }).name;
                            }
                            return 'Unknown';
                          })()}
                        </Badge>
                      </div>
                      {payment.referenceNumber && (
                        <p className="text-xs text-muted-foreground">Ref: {payment.referenceNumber}</p>
                      )}
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{dateFormatter.format(new Date(payment.paymentDate))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<Credit>[]>(() => {
    return [
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <Badge variant={type === CreditTypeEnum.PAYABLE ? "secondary" : "outline"}>
              {type === CreditTypeEnum.PAYABLE ? "Payable" : "Receivable"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "supplier",
        header: "Supplier/Customer",
        cell: ({ row }) => {
          const credit = row.original;
          const name = credit.supplier?.name || credit.customer?.name || "—";
          return <span className="text-sm font-semibold">{name}</span>;
        },
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            {currencyFormatter.format(parseFloat(row.original.totalAmount))}
          </div>
        ),
      },
      {
        accessorKey: "paidAmount",
        header: () => <div className="text-right">Paid</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            {currencyFormatter.format(parseFloat(row.original.paidAmount))}
          </div>
        ),
      },
      {
        accessorKey: "balanceAmount",
        header: () => <div className="text-right">Balance</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-semibold tabular-nums">
            {currencyFormatter.format(parseFloat(row.original.balanceAmount))}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
        },
      },
      {
        accessorKey: "dueDate",
        header: () => <div className="hidden text-right lg:block">Due Date</div>,
        cell: ({ row }) => (
          <div className="hidden text-right text-sm text-muted-foreground lg:block">
            {row.original.dueDate ? dateFormatter.format(new Date(row.original.dueDate)) : "—"}
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
          const credit = row.original;
          const purchaseStatus = credit.purchase?.status;
          const saleStatus = credit.sale?.status;
          const isLinkedPendingOrCancelled =
            purchaseStatus === "PENDING" ||
            purchaseStatus === "CANCELLED" ||
            saleStatus === "PENDING" ||
            saleStatus === "CANCELLED";
          const canPay =
            credit.status !== CreditStatusEnum.PAID &&
            parseFloat(credit.balanceAmount) > 0 &&
            !isLinkedPendingOrCancelled;
          const paymentsCount = Array.isArray(credit.payments) ? credit.payments.length : 0;
          const hasPayments = paymentsCount > 0;
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
                    aria-label="Open credit actions"
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
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleEdit(credit);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (!canPay) {
                        // Frontend hint for blocked states; backend still enforces exact messages.
                        let message: string | null = null;
                        if (credit.status === CreditStatusEnum.PAID) {
                          message = "Credit is already fully paid";
                        } else if (isLinkedPendingOrCancelled) {
                          if (purchaseStatus === "PENDING") {
                            message = "Cannot pay credit for a pending purchase.";
                          } else if (purchaseStatus === "CANCELLED") {
                            message = "Cannot pay credit for a cancelled purchase.";
                          } else if (saleStatus === "PENDING") {
                            message = "Cannot pay credit for a pending sale.";
                          } else if (saleStatus === "CANCELLED") {
                            message = "Cannot pay credit for a cancelled sale.";
                          }
                        }
                        if (message) {
                          handleApiError(message, { showToast: true, logError: false });
                        }
                        return;
                      }
                      handleRecordPayment(credit);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    disabled={!canPay}
                  >
                    <IconCurrencyDollar className="mr-2 size-4" />
                    Record Payment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (hasPayments) {
                        const message = `Cannot delete credit with ${paymentsCount} payment(s). Refund or delete payments first.`;
                        handleApiError(message, { showToast: true, logError: false });
                        return;
                      }
                      // Prevent row click by temporarily disabling pointer events on the row
                      const target = event.target as HTMLElement;
                      const row = target.closest('tr');
                      if (row) {
                        (row as HTMLElement).style.pointerEvents = 'none';
                        setTimeout(() => {
                          (row as HTMLElement).style.pointerEvents = '';
                        }, 100);
                      }
                      setConfirmDeleteId(credit.id);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (hasPayments) {
                        const message = `Cannot delete credit with ${paymentsCount} payment(s). Refund or delete payments first.`;
                        handleApiError(message, { showToast: true, logError: false });
                        return;
                      }
                      // Prevent row click by temporarily disabling pointer events on the row
                      const target = e.target as HTMLElement;
                      const row = target.closest('tr');
                      if (row) {
                        (row as HTMLElement).style.pointerEvents = 'none';
                        setTimeout(() => {
                          (row as HTMLElement).style.pointerEvents = '';
                        }, 100);
                      }
                      setConfirmDeleteId(credit.id);
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
                  >
                    <IconTrash className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [handleEdit, handleRecordPayment]);

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Credits</h1>
            <p className="text-sm text-muted-foreground">Manage payable and receivable credits</p>
            <p className="mt-1 text-xs text-muted-foreground">Total credits: {total}</p>
          </div>
          <Button onClick={handleCreate}>
            <IconFilePlus className="mr-2 size-4" />
            Create Credit
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={credits}
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
          emptyMessage="No credits found"
          enableColumnVisibility={true}
          tabs={[
            { value: "all", label: "All", badge: total },
            { value: "payable", label: "Payable", badge: payableCount },
            { value: "receivable", label: "Receivable", badge: receivableCount },
          ]}
          defaultTab={activeTab}
          onTabChange={(value: string) => {
            setActiveTab(value as "all" | "payable" | "receivable");
            setPage(1);
          }}
          renderDetails={renderDetails}
          detailsTitle={() => "Credit Details"}
          detailsDescription={(credit: Credit) => {
            const name = credit.supplier?.name || credit.customer?.name || "Credit";
            return `${name} - ${credit.type}`;
          }}
          renderDetailsFooter={(credit, onClose) => {
            const purchaseStatus = credit.purchase?.status;
            const saleStatus = credit.sale?.status;
            const isLinkedPendingOrCancelled =
              purchaseStatus === "PENDING" ||
              purchaseStatus === "CANCELLED" ||
              saleStatus === "PENDING" ||
              saleStatus === "CANCELLED";
            const canPay =
              credit.status !== CreditStatusEnum.PAID &&
              parseFloat(credit.balanceAmount) > 0 &&
              !isLinkedPendingOrCancelled;
            return (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                    setTimeout(() => {
                      handleEdit(credit);
                    }, 0);
                  }}
                  className="w-full"
                >
                  <IconPencil className="mr-2 size-4" />
                  Edit Credit
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                    setTimeout(() => {
                      handleRecordPayment(credit);
                    }, 0);
                  }}
                  className="w-full"
                  disabled={!canPay}
                >
                  <IconCurrencyDollar className="mr-2 size-4" />
                  Record Payment
                </Button>
                {isLinkedPendingOrCancelled && (
                  <p className="text-xs text-muted-foreground text-center">
                    Credits for pending or cancelled purchases/sales cannot be paid. Use the purchase or sale workflow (cancel/refund) instead.
                  </p>
                )}
              </div>
            );
          }}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search by supplier, customer, or notes..."
                className="w-full min-w-0 sm:w-56"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={statusFilter || "__all__"}
                onValueChange={(value) => {
                  setStatusFilter(value === "__all__" ? "" : (value as CreditStatus));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Statuses</SelectItem>
                  <SelectItem value={CreditStatusEnum.PENDING}>Pending</SelectItem>
                  <SelectItem value={CreditStatusEnum.PARTIAL}>Partial</SelectItem>
                  <SelectItem value={CreditStatusEnum.PAID}>Paid</SelectItem>
                  <SelectItem value={CreditStatusEnum.OVERDUE}>Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value || "createdAt");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="totalAmount">Total Amount</SelectItem>
                  <SelectItem value="balanceAmount">Balance</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value) => {
                  setSortOrder((value || "DESC") as "ASC" | "DESC");
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

      {/* Create/Edit Dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Credit" : "Create Credit"}
        size="2xl"
        error={formError}
      >
        <CreditForm
          credit={editing}
          onSuccess={handleFormSuccess}
          onCancel={handleDialogClose}
          onErrorChange={setFormError}
          onSubmittingChange={setFormSubmitting}
        />
      </FormDialog>

      {/* Payment Dialog */}
      <FormDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        title="Record Payment"
        size="md"
        error={formError}
      >
        {paymentCredit && (
          <PaymentForm
            credit={paymentCredit}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentDialogClose}
            onErrorChange={setFormError}
            onSubmittingChange={setFormSubmitting}
          />
        )}
      </FormDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null);
          }
        }}
      >
        {(() => {
          const creditToDelete = confirmDeleteId
            ? credits.find((c) => c.id === confirmDeleteId)
            : null;
          const paymentsCount = creditToDelete?.payments ? creditToDelete.payments.length : 0;
          const hasPayments = paymentsCount > 0;
          return (
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Delete Credit</AlertDialogTitle>
            <AlertDesc>
              Are you sure you want to delete this credit? This action cannot be undone.
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                Credits with payments cannot be deleted. Credits linked to non-pending purchases or sales must be handled via the purchase or sale workflow (cancel/refund).
              </span>
            </AlertDesc>
          </AlertHeader>
          <AlertFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) {
                  void handleDelete(confirmDeleteId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending || hasPayments}
            >
              Delete
            </AlertDialogAction>
          </AlertFooter>
        </AlertDialogContent>
          );
        })()}
      </AlertDialog>
    </div>
  );
}

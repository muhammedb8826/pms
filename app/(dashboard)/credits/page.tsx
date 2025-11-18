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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UnifiedDataTable } from "@/components/unified-data-table";
import { useCredits, useDeleteCredit } from "@/features/credit/hooks/useCredits";
import type { Credit, CreditStatus } from "@/features/credit/types";
import { CreditType as CreditTypeEnum, CreditStatus as CreditStatusEnum } from "@/features/credit/types";
import { CreditForm } from "@/features/credit/components/CreditForm";
import { PaymentForm } from "@/features/credit/components/PaymentForm";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
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

  // Calculate tab badges
  const payableCount = useMemo(() => {
    // This would ideally come from a separate query, but for now we'll filter client-side
    return credits.filter(c => c.type === CreditTypeEnum.PAYABLE).length;
  }, [credits]);

  const receivableCount = useMemo(() => {
    return credits.filter(c => c.type === CreditTypeEnum.RECEIVABLE).length;
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
  const [formSubmitting, setFormSubmitting] = useState(false);

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

  const handlePageChange = useCallback(
    (nextIndex: number) => {
      const nextPage = Math.min(Math.max(nextIndex + 1, 1), pageCount);
      setPage(nextPage);
    },
    [pageCount],
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
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
          return (
            <div className="text-left text-sm font-semibold">
              {name}
            </div>
          );
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
          return (
            <Badge variant={getStatusBadgeVariant(status)}>
              {status}
            </Badge>
          );
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
          const canPay = credit.status !== CreditStatusEnum.PAID && parseFloat(credit.balanceAmount) > 0;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open credit actions"
                  >
                    <IconDotsVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleEdit(credit);
                    }}
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  {canPay && (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        handleRecordPayment(credit);
                      }}
                    >
                      <IconCurrencyDollar className="mr-2 size-4" />
                      Record Payment
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(event) => {
                      event.preventDefault();
                      setConfirmDeleteId(credit.id);
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Credits</h1>
        <p className="text-sm text-muted-foreground">Manage payable and receivable credits</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search by supplier, customer, or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
        </div>
        <Select
          value={statusFilter || "__all__"}
          onValueChange={(value) => {
            setStatusFilter(value === "__all__" ? "" : (value as CreditStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[60]">
            <SelectItem value="__all__">All Statuses</SelectItem>
            <SelectItem value={CreditStatusEnum.PENDING}>Pending</SelectItem>
            <SelectItem value={CreditStatusEnum.PARTIAL}>Partial</SelectItem>
            <SelectItem value={CreditStatusEnum.PAID}>Paid</SelectItem>
            <SelectItem value={CreditStatusEnum.OVERDUE}>Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <UnifiedDataTable
        data={credits}
        columns={columns}
        loading={loading}
        emptyMessage="No credits found"
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
        pageIndex={page - 1}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        renderDetails={(credit: Credit) => {
          // Use the credit data directly, or fetch if needed
          const creditData = credit;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant={creditData.type === CreditTypeEnum.PAYABLE ? "secondary" : "outline"}>
                    {creditData.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(creditData.status)}>
                    {creditData.status}
                  </Badge>
                </div>
              </div>
              {creditData.supplier && (
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{creditData.supplier.name}</p>
                </div>
              )}
              {creditData.customer && (
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{creditData.customer.name}</p>
                </div>
              )}
              {creditData.purchase && (
                <div>
                  <p className="text-sm text-muted-foreground">Purchase</p>
                  <p className="font-medium">{creditData.purchase.invoiceNo}</p>
                </div>
              )}
              {creditData.sale && (
                <div>
                  <p className="text-sm text-muted-foreground">Sale</p>
                  <p className="font-medium">{creditData.sale.invoiceNo || creditData.sale.id}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">{currencyFormatter.format(parseFloat(creditData.totalAmount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                  <p className="font-semibold">{currencyFormatter.format(parseFloat(creditData.paidAmount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance Amount</p>
                  <p className="font-semibold text-destructive">
                    {currencyFormatter.format(parseFloat(creditData.balanceAmount))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {creditData.dueDate ? dateFormatter.format(new Date(creditData.dueDate)) : "—"}
                  </p>
                </div>
              </div>
              {creditData.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{creditData.notes}</p>
                </div>
              )}
              {creditData.payments && creditData.payments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Payment History</p>
                  <div className="border rounded-lg divide-y">
                    {creditData.payments.map((payment) => (
                      <div key={payment.id} className="p-3 space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{currencyFormatter.format(parseFloat(payment.amount))}</span>
                              <Badge variant="outline" className="text-xs">
                                {payment.paymentMethod.replace(/_/g, ' ')}
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
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p>Created</p>
                  <p>{dateFormatter.format(new Date(creditData.createdAt))}</p>
                </div>
                <div>
                  <p>Updated</p>
                  <p>{dateFormatter.format(new Date(creditData.updatedAt))}</p>
                </div>
              </div>
            </div>
          );
        }}
        detailsTitle={() => `Credit Details`}
        detailsDescription={(credit: Credit) => {
          const name = credit.supplier?.name || credit.customer?.name || "Credit";
          return `${name} - ${credit.type}`;
        }}
        headerActions={
          <Button onClick={handleCreate}>
            <IconFilePlus className="mr-2 size-4" />
            Create Credit
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Credit" : "Create Credit"}</DialogTitle>
          </DialogHeader>
          <CreditForm
            credit={editing}
            onSuccess={handleFormSuccess}
            onCancel={handleDialogClose}
            onErrorChange={setFormError}
            onSubmittingChange={setFormSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {paymentCredit && (
            <PaymentForm
              credit={paymentCredit}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentDialogClose}
              onErrorChange={setFormError}
              onSubmittingChange={setFormSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Delete Credit</AlertDialogTitle>
            <AlertDesc>Are you sure you want to delete this credit? This action cannot be undone.</AlertDesc>
          </AlertHeader>
          <AlertFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
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

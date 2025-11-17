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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter as DrawerFooterSection,
  DrawerHeader as DrawerHeaderSection,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { ListDataTable } from "@/components/list-data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCredits, useCredit, useDeleteCredit } from "@/features/credit/hooks/useCredits";
import type { Credit, CreditType, CreditStatus } from "@/features/credit/types";
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
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CreditType | "">("");
  const [statusFilter, setStatusFilter] = useState<CreditStatus | "">("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const { credits, total, loading, error, refetch } = useCredits(page, pageSize, {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

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

  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewQuery = useCredit(viewId ?? undefined);

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

  const handleView = useCallback((credit: Credit) => {
    setViewId(credit.id);
    setViewOpen(true);
  }, []);

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
    if (viewId === paymentCredit?.id) {
      // Refresh view if we're viewing the same credit
      refetch();
    }
  }, [handlePaymentDialogClose, refetch, viewId, paymentCredit]);

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
            <button
              type="button"
              onClick={() => handleView(credit)}
              className="text-left text-sm font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {name}
            </button>
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
                      handleView(credit);
                    }}
                  >
                    View details
                  </DropdownMenuItem>
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
  }, [handleView, handleEdit, handleRecordPayment]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Credits</h1>
          <p className="text-sm text-muted-foreground">Manage payable and receivable credits</p>
        </div>
        <Button onClick={handleCreate}>
          <IconFilePlus className="mr-2 size-4" />
          Create Credit
        </Button>
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
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value as CreditType | "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[60]">
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value={CreditTypeEnum.PAYABLE}>Payable</SelectItem>
            <SelectItem value={CreditTypeEnum.RECEIVABLE}>Receivable</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as CreditStatus | "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[60]">
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value={CreditStatusEnum.PENDING}>Pending</SelectItem>
            <SelectItem value={CreditStatusEnum.PARTIAL}>Partial</SelectItem>
            <SelectItem value={CreditStatusEnum.PAID}>Paid</SelectItem>
            <SelectItem value={CreditStatusEnum.OVERDUE}>Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ListDataTable
        columns={columns}
        data={credits}
        loading={loading}
        pageIndex={page - 1}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        emptyMessage="No credits found"
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

      {/* View Drawer */}
      {isMobile ? (
        <Drawer open={viewOpen} onOpenChange={setViewOpen}>
          <DrawerContent>
            <DrawerHeaderSection>
              <DrawerTitle>Credit Details</DrawerTitle>
              <DrawerDescription>View credit information</DrawerDescription>
            </DrawerHeaderSection>
            <div className="overflow-y-auto px-4 pb-4">
              {viewQuery.isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
              ) : viewQuery.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge variant={viewQuery.data.type === CreditTypeEnum.PAYABLE ? "secondary" : "outline"}>
                        {viewQuery.data.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={getStatusBadgeVariant(viewQuery.data.status)}>
                        {viewQuery.data.status}
                      </Badge>
                    </div>
                  </div>
                  {viewQuery.data.supplier && (
                    <div>
                      <p className="text-sm text-muted-foreground">Supplier</p>
                      <p className="font-medium">{viewQuery.data.supplier.name}</p>
                    </div>
                  )}
                  {viewQuery.data.customer && (
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">{viewQuery.data.customer.name}</p>
                    </div>
                  )}
                  {viewQuery.data.purchase && (
                    <div>
                      <p className="text-sm text-muted-foreground">Purchase</p>
                      <p className="font-medium">{viewQuery.data.purchase.invoiceNo}</p>
                    </div>
                  )}
                  {viewQuery.data.sale && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sale</p>
                      <p className="font-medium">{viewQuery.data.sale.invoiceNo || viewQuery.data.sale.id}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">{currencyFormatter.format(parseFloat(viewQuery.data.totalAmount))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Amount</p>
                      <p className="font-semibold">{currencyFormatter.format(parseFloat(viewQuery.data.paidAmount))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance Amount</p>
                      <p className="font-semibold text-destructive">
                        {currencyFormatter.format(parseFloat(viewQuery.data.balanceAmount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">
                        {viewQuery.data.dueDate ? dateFormatter.format(new Date(viewQuery.data.dueDate)) : "—"}
                      </p>
                    </div>
                  </div>
                  {viewQuery.data.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm">{viewQuery.data.notes}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p>Created</p>
                      <p>{dateFormatter.format(new Date(viewQuery.data.createdAt))}</p>
                    </div>
                    <div>
                      <p>Updated</p>
                      <p>{dateFormatter.format(new Date(viewQuery.data.updatedAt))}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">Failed to load credit</div>
              )}
            </div>
            <DrawerFooterSection>
              {viewQuery.data && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewOpen(false);
                      handleEdit(viewQuery.data!);
                    }}
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  {viewQuery.data.status !== CreditStatusEnum.PAID &&
                    parseFloat(viewQuery.data.balanceAmount) > 0 && (
                      <Button
                        onClick={() => {
                          setViewOpen(false);
                          handleRecordPayment(viewQuery.data!);
                        }}
                      >
                        <IconCurrencyDollar className="mr-2 size-4" />
                        Record Payment
                      </Button>
                    )}
                </>
              )}
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooterSection>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Credit Details</DialogTitle>
            </DialogHeader>
            {viewQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : viewQuery.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant={viewQuery.data.type === CreditTypeEnum.PAYABLE ? "secondary" : "outline"}>
                      {viewQuery.data.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusBadgeVariant(viewQuery.data.status)}>
                      {viewQuery.data.status}
                    </Badge>
                  </div>
                </div>
                {viewQuery.data.supplier && (
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">{viewQuery.data.supplier.name}</p>
                  </div>
                )}
                {viewQuery.data.customer && (
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{viewQuery.data.customer.name}</p>
                  </div>
                )}
                {viewQuery.data.purchase && (
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase</p>
                    <p className="font-medium">{viewQuery.data.purchase.invoiceNo}</p>
                  </div>
                )}
                {viewQuery.data.sale && (
                  <div>
                    <p className="text-sm text-muted-foreground">Sale</p>
                    <p className="font-medium">{viewQuery.data.sale.invoiceNo || viewQuery.data.sale.id}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">{currencyFormatter.format(parseFloat(viewQuery.data.totalAmount))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Amount</p>
                    <p className="font-semibold">{currencyFormatter.format(parseFloat(viewQuery.data.paidAmount))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance Amount</p>
                    <p className="font-semibold text-destructive">
                      {currencyFormatter.format(parseFloat(viewQuery.data.balanceAmount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {viewQuery.data.dueDate ? dateFormatter.format(new Date(viewQuery.data.dueDate)) : "—"}
                    </p>
                  </div>
                </div>
                {viewQuery.data.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{viewQuery.data.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p>Created</p>
                    <p>{dateFormatter.format(new Date(viewQuery.data.createdAt))}</p>
                  </div>
                  <div>
                    <p>Updated</p>
                    <p>{dateFormatter.format(new Date(viewQuery.data.updatedAt))}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewOpen(false);
                      handleEdit(viewQuery.data!);
                    }}
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  {viewQuery.data.status !== CreditStatusEnum.PAID &&
                    parseFloat(viewQuery.data.balanceAmount) > 0 && (
                      <Button
                        onClick={() => {
                          setViewOpen(false);
                          handleRecordPayment(viewQuery.data!);
                        }}
                      >
                        <IconCurrencyDollar className="mr-2 size-4" />
                        Record Payment
                      </Button>
                    )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">Failed to load credit</div>
            )}
          </DialogContent>
        </Dialog>
      )}

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

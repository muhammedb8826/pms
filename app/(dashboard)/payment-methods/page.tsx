"use client";

import React, { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconFilePlus,
  IconPencil,
  IconSettings,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { usePaymentMethods, useDeletePaymentMethod } from "@/features/payment-method/hooks/usePaymentMethods";
import type { PaymentMethod } from "@/features/payment-method/types";
import { PaymentMethodForm } from "@/features/payment-method/components/PaymentMethodForm";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export default function PaymentMethodsPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState("");

  const { paymentMethods: allPaymentMethods, loading, error, refetch } = usePaymentMethods({
    includeInactive,
  });

  // Filter payment methods by search
  const filteredPaymentMethods = useMemo(() => {
    if (!search.trim()) return allPaymentMethods;
    const searchLower = search.toLowerCase();
    return allPaymentMethods.filter(
      (pm) =>
        pm.name.toLowerCase().includes(searchLower) ||
        (pm.description && pm.description.toLowerCase().includes(searchLower)) ||
        (pm.icon && pm.icon.toLowerCase().includes(searchLower))
    );
  }, [allPaymentMethods, search]);

  // Sort by sortOrder, then by name
  const sortedPaymentMethods = useMemo(() => {
    return [...filteredPaymentMethods].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredPaymentMethods]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeletePaymentMethod();

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess("Payment method deleted successfully");
        refetch();
      } catch (err) {
        const errorMessage = handleApiError(err, {
          defaultMessage: "Failed to delete payment method",
        });
        // Check if error is about payment method being in use
        if (
          errorMessage.includes("used in") ||
          errorMessage.includes("transaction")
        ) {
          handleApiError(err, {
            defaultMessage:
              "Cannot delete payment method. It is used in transactions. Deactivate it instead.",
          });
        }
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteMutation, refetch]
  );

  const handleEdit = useCallback((paymentMethod: PaymentMethod) => {
    setEditing(paymentMethod);
    setDialogOpen(true);
  }, []);

  const renderDetails = useCallback((paymentMethod: PaymentMethod) => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-medium text-foreground">{paymentMethod.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Description</div>
            <div className="text-foreground">
              {paymentMethod.description ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Icon</div>
            <div className="text-foreground">{paymentMethod.icon ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <Badge variant={paymentMethod.isActive ? "default" : "secondary"}>
              {paymentMethod.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-foreground">
              {paymentMethod.createdAt
                ? dateFormatter.format(new Date(paymentMethod.createdAt))
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Last updated</div>
            <div className="text-foreground">
              {paymentMethod.updatedAt
                ? dateFormatter.format(new Date(paymentMethod.updatedAt))
                : "—"}
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<PaymentMethod>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "Payment Method",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {row.original.name}
            </span>
            {!row.original.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.description ? row.original.description : "—"}
          </span>
        ),
      },
      {
        accessorKey: "icon",
        header: "Icon",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.icon ? row.original.icon : "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="hidden text-right lg:block">Created</div>,
        cell: ({ row }) => (
          <div className="hidden text-right text-sm text-muted-foreground lg:block">
            {row.original.createdAt
              ? dateFormatter.format(new Date(row.original.createdAt))
              : "—"}
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
          const paymentMethod = row.original;
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open payment method actions"
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
                      handleEdit(paymentMethod);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit payment method
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setConfirmDeleteId(paymentMethod.id);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmDeleteId(paymentMethod.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete payment method
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [handleEdit]);

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Payment Methods</h1>
            <p className="text-sm text-muted-foreground">
              Manage payment methods for sales and purchases.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total: {sortedPaymentMethods.length} payment method
              {sortedPaymentMethods.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <IconFilePlus className="mr-2 size-4" />
            Add Payment Method
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={sortedPaymentMethods}
          loading={loading}
          pageIndex={0}
          pageSize={sortedPaymentMethods.length || 10}
          pageCount={1}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          emptyMessage="No payment methods found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(pm) => pm.name}
          detailsDescription={(pm) => pm.description || ""}
          renderDetailsFooter={(paymentMethod, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  handleEdit(paymentMethod);
                }, 0);
              }}
              className="w-full"
            >
              <IconPencil className="mr-2 size-4" />
              Edit Payment Method
            </Button>
          )}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search payment methods..."
                className="w-full min-w-0 sm:w-56"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInactive"
                  checked={includeInactive}
                  onCheckedChange={(checked) =>
                    setIncludeInactive(checked === true)
                  }
                />
                <Label
                  htmlFor="includeInactive"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include inactive
                </Label>
              </div>
            </div>
          }
        />
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setFormError(null);
            setFormSubmitting(false);
          }
        }}
        title={editing ? "Edit Payment Method" : "Create Payment Method"}
        size="2xl"
        error={formError}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="payment-method-form"
              disabled={formSubmitting}
            >
              {formSubmitting ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <PaymentMethodForm
          paymentMethod={editing}
          onSuccess={() => {
            setDialogOpen(false);
            setEditing(null);
            refetch();
            handleApiSuccess(
              editing
                ? "Payment method updated successfully"
                : "Payment method created successfully"
            );
          }}
          onCancel={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          onErrorChange={setFormError}
          onSubmittingChange={setFormSubmitting}
          formId="payment-method-form"
          hideActions
        />
      </FormDialog>

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
            <AlertDialogTitle>Delete payment method?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this payment method. Payment
            methods that are used in transactions cannot be deleted. If this
            payment method is in use, you should deactivate it instead.
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
            >
              Delete
            </AlertDialogAction>
          </AlertFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


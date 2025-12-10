"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { IconDotsVertical, IconFilePlus, IconPencil, IconSettings } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
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
import { useBatches, useDeleteBatch } from "@/features/batch/hooks/useBatches";
import type { Batch } from "@/features/batch/types";
import { BatchStatus } from "@/features/batch/types";
import { useAllProducts } from "@/features/product/hooks/useProducts";
import type { Product } from "@/features/product/types";
import { useAllSuppliers } from "@/features/supplier/hooks/useSuppliers";
import type { Supplier } from "@/features/supplier/types";
import BatchForm from "@/features/batch/components/BatchForm";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export default function BatchesPage() {
  const router = useRouter();
  const [productId, setProductId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [expiredOnly, setExpiredOnly] = useState<"all" | "true" | "false">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { batches, loading, error, refetch } = useBatches({
    productId: productId || undefined,
    supplierId: supplierId || undefined,
    expiredOnly: expiredOnly === "true" ? true : expiredOnly === "false" ? false : undefined,
  });

  const productsQuery = useAllProducts();
  const suppliersQuery = useAllSuppliers();

  const products = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = productsQuery.data as Product[] | Wrapped<Product[]> | undefined;
    if (!data) return [] as Product[];
    if (Array.isArray(data)) return data;
    if ("data" in data && Array.isArray(data.data)) return data.data as Product[];
    return [] as Product[];
  }, [productsQuery.data]);

  const suppliers = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = suppliersQuery.data as Supplier[] | Wrapped<Supplier[]> | undefined;
    if (!data) return [] as Supplier[];
    if (Array.isArray(data)) return data;
    if ("data" in data && Array.isArray(data.data)) return data.data as Supplier[];
    return [] as Supplier[];
  }, [suppliersQuery.data]);

  const sortedBatches = useMemo(() => {
    // Default to newest first using createdAt
    return [...batches].sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate;
    });
  }, [batches]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(sortedBatches.length / pageSize) || 1),
    [sortedBatches.length, pageSize],
  );

  const paginatedBatches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedBatches.slice(start, start + pageSize);
  }, [sortedBatches, page, pageSize]);

  const deleteMutation = useDeleteBatch();

  const handleEdit = useCallback((batch: Batch) => {
    router.push(`/batches/${batch.id}/edit`);
  }, [router]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const result = await deleteMutation.mutateAsync(id);
        if (result && typeof result === "object" && "error" in result && (result as { error?: unknown }).error) {
          handleApiError((result as { error?: unknown }).error, { defaultMessage: "Failed to delete batch" });
          return;
        }
        setConfirmDeleteId(null);
        refetch();
        handleApiSuccess("Batch deleted successfully");
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to delete batch" });
      }
    },
    [deleteMutation, refetch],
  );

  const columns = useMemo<ColumnDef<Batch>[]>(() => {
    return [
      {
        accessorKey: "batchNumber",
        header: "Batch",
        cell: ({ row }) => (
          <span className="text-sm font-semibold">
            {row.original.batchNumber}
          </span>
        ),
      },
      {
        accessorKey: "product",
        header: "Product",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{row.original.product?.name ?? "—"}</span>
            {row.original.product?.category?.name ? (
              <span className="text-xs text-muted-foreground">{row.original.product.category.name}</span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="font-medium text-foreground">{row.original.supplier?.name ?? "—"}</span>
            {row.original.supplier?.contact ? (
              <span className="text-xs text-muted-foreground">{row.original.supplier.contact}</span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "expiryDate",
        header: "Expiry",
        cell: ({ row }) => {
          const batch = row.original;
          const expiry = new Date(batch.expiryDate);
          const isValid = !Number.isNaN(expiry.getTime());
          const status = batch.status || BatchStatus.ACTIVE;
          const isExpired = status === BatchStatus.EXPIRED;
          const isRecalled = batch.recalled || status === BatchStatus.RECALLED;
          const isQuarantined = batch.quarantined || status === BatchStatus.QUARANTINED;
          
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm ${isExpired ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                  {isValid ? dateFormatter.format(expiry) : "—"}
                </span>
                <Badge 
                  variant={
                    isExpired ? "destructive" : 
                    isRecalled ? "destructive" :
                    isQuarantined ? "secondary" :
                    status === BatchStatus.DAMAGED ? "secondary" :
                    status === BatchStatus.RETURNED ? "outline" :
                    "outline"
                  } 
                  className="text-xs uppercase"
                >
                  {status}
                </Badge>
              </div>
              {(isRecalled || isQuarantined) && (
                <div className="flex gap-2 text-xs">
                  {isRecalled && (
                    <Badge variant="destructive" className="text-xs">Recalled</Badge>
                  )}
                  {isQuarantined && (
                    <Badge variant="secondary" className="text-xs">Quarantined</Badge>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">{row.original.quantity.toLocaleString()}</div>
        ),
      },
      {
        accessorKey: "purchasePrice",
        header: () => <div className="hidden text-right lg:block">Purchase</div>,
        cell: ({ row }) => (
          <div className="hidden text-right text-sm text-muted-foreground tabular-nums lg:block">
            {currencyFormatter.format(Number(row.original.purchasePrice ?? 0))}
          </div>
        ),
      },
      {
        accessorKey: "sellingPrice",
        header: () => <div className="text-right">Selling</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            {currencyFormatter.format(Number(row.original.sellingPrice ?? 0))}
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
          const batch = row.original;
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
                    aria-label="Open batch actions"
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
                      handleEdit(batch);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Edit batch
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
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
                      setConfirmDeleteId(batch.id);
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
                      setConfirmDeleteId(batch.id);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Delete batch
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [handleEdit]);

  const renderDetails = useCallback((batch: Batch) => {
    const expiry = new Date(batch.expiryDate);
    const isValid = !Number.isNaN(expiry.getTime());
    const manufacturingDate = batch.manufacturingDate ? new Date(batch.manufacturingDate) : null;
    const manufacturingDateValid = manufacturingDate && !Number.isNaN(manufacturingDate.getTime());
    const status = batch.status || BatchStatus.ACTIVE;
    const isExpired = status === BatchStatus.EXPIRED;
    const isRecalled = batch.recalled || status === BatchStatus.RECALLED;
    const isQuarantined = batch.quarantined || status === BatchStatus.QUARANTINED;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Batch number</div>
            <div className="font-medium text-foreground">{batch.batchNumber}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Product</div>
            <div className="font-medium text-foreground">{batch.product?.name ?? "—"}</div>
            {batch.product?.category?.name ? (
              <div className="text-xs text-muted-foreground">{batch.product.category.name}</div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Supplier</div>
            <div className="font-medium text-foreground">{batch.supplier?.name ?? "—"}</div>
            {batch.supplier?.contact ? (
              <div className="text-xs text-muted-foreground">{batch.supplier.contact}</div>
            ) : null}
            {batch.supplier?.email ? (
              <div className="text-xs text-muted-foreground">{batch.supplier.email}</div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Quantity</div>
              <div className="font-medium tabular-nums">{batch.quantity.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Purchase price</div>
              <div className="font-medium tabular-nums">
                {currencyFormatter.format(Number(batch.purchasePrice ?? 0))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Selling price</div>
              <div className="font-medium tabular-nums">
                {currencyFormatter.format(Number(batch.sellingPrice ?? 0))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div>
                <Badge 
                  variant={
                    isExpired ? "destructive" : 
                    isRecalled ? "destructive" :
                    isQuarantined ? "secondary" :
                    status === BatchStatus.DAMAGED ? "secondary" :
                    status === BatchStatus.RETURNED ? "outline" :
                    "outline"
                  } 
                  className="text-xs uppercase"
                >
                  {status}
                </Badge>
              </div>
            </div>
            {manufacturingDateValid && (
              <div>
                <div className="text-xs text-muted-foreground">Manufacturing date</div>
                <div className="font-medium text-foreground">{dateFormatter.format(manufacturingDate)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Created</div>
              <div className="font-medium text-foreground">
                {batch.createdAt ? new Date(batch.createdAt).toLocaleString() : "—"}
              </div>
            </div>
            {batch.updatedAt && (
              <div>
                <div className="text-xs text-muted-foreground">Last updated</div>
                <div className="font-medium text-foreground">
                  {new Date(batch.updatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Expiry</div>
            {isValid ? (
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isExpired ? "text-destructive" : "text-foreground"}`}>
                  {dateFormatter.format(expiry)}
                </span>
              </div>
            ) : (
              <div className="font-medium text-foreground">—</div>
            )}
          </div>
        </div>

        {isRecalled && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm">
            <div className="font-semibold text-destructive mb-2">Recall Information</div>
            {batch.recallDate && (
              <div>
                <span className="text-xs text-muted-foreground">Recall date: </span>
                <span className="font-medium">{dateFormatter.format(new Date(batch.recallDate))}</span>
              </div>
            )}
            {batch.recallReason && (
              <div>
                <span className="text-xs text-muted-foreground">Reason: </span>
                <span className="font-medium">{batch.recallReason}</span>
              </div>
            )}
            {batch.recallReference && (
              <div>
                <span className="text-xs text-muted-foreground">Reference: </span>
                <span className="font-medium">{batch.recallReference}</span>
              </div>
            )}
          </div>
        )}

        {isQuarantined && (
          <div className="rounded-lg border border-orange-500 bg-orange-500/10 p-4 text-sm">
            <div className="font-semibold text-orange-700 dark:text-orange-400 mb-2">Quarantine Information</div>
            {batch.quarantineDate && (
              <div>
                <span className="text-xs text-muted-foreground">Quarantine date: </span>
                <span className="font-medium">{dateFormatter.format(new Date(batch.quarantineDate))}</span>
              </div>
            )}
            {batch.quarantineReason && (
              <div>
                <span className="text-xs text-muted-foreground">Reason: </span>
                <span className="font-medium">{batch.quarantineReason}</span>
              </div>
            )}
          </div>
        )}
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
            <h1 className="text-xl font-semibold">Batches</h1>
            <p className="text-sm text-muted-foreground">
              Monitor product batches, supplier information, and expiration dates.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Total batches: {batches.length}</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setDialogOpen(true);
            }}
          >
            <IconFilePlus className="mr-2 size-4" />
            Add Batch
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={paginatedBatches}
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
          emptyMessage="No batches found for the selected filters."
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(batch) => batch.batchNumber}
          detailsDescription={(batch) => {
            const expiry = new Date(batch.expiryDate);
            if (Number.isNaN(expiry.getTime())) return batch.product?.name ?? "—";
            return `${batch.product?.name ?? "—"} • Expires ${dateFormatter.format(expiry)}`;
          }}
          renderDetailsFooter={(batch, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  router.push(`/batches/${batch.id}/edit`);
                }, 0);
              }}
              className="w-full"
            >
              <IconPencil className="mr-2 size-4" />
              Edit Batch
            </Button>
          )}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Select
                value={productId || "__all__"}
                onValueChange={(value) => {
                  setProductId(value === "__all__" ? "" : (value ?? ""));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All products</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={supplierId || "__all__"}
                onValueChange={(value) => {
                  setSupplierId(value === "__all__" ? "" : (value ?? ""));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={expiredOnly}
                onValueChange={(value) => {
                  setExpiredOnly((value as "all" | "true" | "false") ?? "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Expiry filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="false">Non-expired</SelectItem>
                  <SelectItem value="true">Expired only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
          }
        }}
        title={editingId ? "Edit Batch" : "Add Batch"}
        size="2xl"
      >
        <BatchForm
          batch={editingId ? batches.find((batch) => batch.id === editingId) ?? null : null}
          onSuccess={() => {
            setDialogOpen(false);
            setEditingId(null);
            refetch();
          }}
          onCancel={() => {
            setDialogOpen(false);
            setEditingId(null);
          }}
        />
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
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Delete batch?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete{" "}
            {confirmDeleteId && batches.find((b) => b.id === confirmDeleteId) ? (
              <span className="font-medium">{batches.find((b) => b.id === confirmDeleteId)?.batchNumber}</span>
            ) : (
              "this batch"
            )}
            . This cannot be undone.
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

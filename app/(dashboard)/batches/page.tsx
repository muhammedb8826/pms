"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  AlertDialogTrigger,
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
import { useBatches, useDeleteBatch } from "@/features/batch/hooks/useBatches";
import type { Batch } from "@/features/batch/types";
import { useAllProducts } from "@/features/product/hooks/useProducts";
import type { Product } from "@/features/product/types";
import { useAllSuppliers } from "@/features/supplier/hooks/useSuppliers";
import type { Supplier } from "@/features/supplier/types";
import BatchForm from "@/features/batch/components/BatchForm";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export default function BatchesPage() {
  const isMobile = useIsMobile();
  const [productId, setProductId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [expiredOnly, setExpiredOnly] = useState<"all" | "true" | "false">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
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

  const pageCount = useMemo(() => Math.max(1, Math.ceil(batches.length / pageSize) || 1), [batches.length, pageSize]);
  const paginatedBatches = useMemo(() => {
    const start = pageIndex * pageSize;
    return batches.slice(start, start + pageSize);
  }, [batches, pageIndex, pageSize]);

  useEffect(() => {
    const maxIndex = Math.max(0, pageCount - 1);
    if (pageIndex > maxIndex) {
      setPageIndex(maxIndex);
    }
  }, [pageIndex, pageCount]);

  const selectedBatch = useMemo(
    () => (viewId ? batches.find((batch) => batch.id === viewId) ?? null : null),
    [batches, viewId],
  );

  const deleteMutation = useDeleteBatch();

  const handlePageChange = useCallback(
    (nextIndex: number) => {
      const maxIndex = Math.max(pageCount - 1, 0);
      const clamped = Math.min(Math.max(nextIndex, 0), maxIndex);
      setPageIndex(clamped);
    },
    [pageCount],
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPageIndex(0);
  }, []);

  const handleView = useCallback((batch: Batch) => {
    setViewId(batch.id);
    setViewOpen(true);
  }, []);

  const handleEdit = useCallback((batch: Batch) => {
    setEditingId(batch.id);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const result = await deleteMutation.mutateAsync(id);
        if (result && typeof result === "object" && "error" in result && (result as { error?: unknown }).error) {
          handleApiError((result as { error?: unknown }).error, { defaultMessage: "Failed to delete batch" });
          return;
        }
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
          <button
            type="button"
            onClick={() => handleView(row.original)}
            className="text-left text-sm font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {row.original.batchNumber}
          </button>
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
          const expiry = new Date(row.original.expiryDate);
          const isValid = !Number.isNaN(expiry.getTime());
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expired = isValid && expiry < today;
          return (
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm ${expired ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                {isValid ? dateFormatter.format(expiry) : "—"}
              </span>
              {isValid ? (
                <Badge variant={expired ? "destructive" : "outline"} className="text-xs uppercase">
                  {expired ? "Expired" : "Active"}
                </Badge>
              ) : null}
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
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open batch actions"
                  >
                    <IconDotsVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleView(batch);
                    }}
                  >
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleEdit(batch);
                    }}
                  >
                    Edit batch
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(event) => event.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete batch
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertHeader>
                        <AlertDialogTitle>Delete batch?</AlertDialogTitle>
                      </AlertHeader>
                      <AlertDesc>
                        This action will permanently delete{" "}
                        <span className="font-medium">{batch.batchNumber}</span>. This cannot be undone.
                      </AlertDesc>
                      <AlertFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(batch.id)} disabled={deleteMutation.isPending}>
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
  }, [deleteMutation.isPending, handleDelete, handleEdit, handleView]);

  return (
    <div className="flex flex-col gap-4 overflow-x-hidden p-4">
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

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            value={productId || "__all__"}
            onValueChange={(value) => {
              setProductId(value === "__all__" ? "" : (value ?? ""));
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-full min-w-0 sm:w-48">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
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
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-full min-w-0 sm:w-48">
              <SelectValue placeholder="All suppliers" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
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
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-full min-w-0 sm:w-40">
              <SelectValue placeholder="Expiry filter" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="false">Non-expired</SelectItem>
              <SelectItem value="true">Expired only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {typeof error === "string" ? error : "Failed to load batches."}
          </div>
        ) : null}

        <ListDataTable
          columns={columns}
          data={paginatedBatches}
          loading={loading}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          emptyMessage="No batches found for the selected filters."
        />
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Batch" : "Add Batch"}</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      <Drawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) {
            setViewId(null);
          }
        }}
        direction={isMobile ? "bottom" : "right"}
      >
        <DrawerContent className="max-h-[95vh] sm:max-w-lg">
          <DrawerHeaderSection className="gap-1">
            <DrawerTitle>{selectedBatch?.batchNumber ?? "Batch details"}</DrawerTitle>
            {selectedBatch ? (
              <DrawerDescription>
                {selectedBatch.product?.name ?? "—"} •{" "}
                {(() => {
                  const expiry = new Date(selectedBatch.expiryDate);
                  if (Number.isNaN(expiry.getTime())) return "No expiry date";
                  return `Expires ${dateFormatter.format(expiry)}`;
                })()}
              </DrawerDescription>
            ) : null}
          </DrawerHeaderSection>
          <div className="space-y-6 px-4 pb-4">
            {selectedBatch ? (
              <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Batch number</div>
                  <div className="font-medium text-foreground">{selectedBatch.batchNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Product</div>
                  <div className="font-medium text-foreground">{selectedBatch.product?.name ?? "—"}</div>
                  {selectedBatch.product?.category?.name ? (
                    <div className="text-xs text-muted-foreground">{selectedBatch.product.category.name}</div>
                  ) : null}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Supplier</div>
                  <div className="font-medium text-foreground">{selectedBatch.supplier?.name ?? "—"}</div>
                  {selectedBatch.supplier?.contact ? (
                    <div className="text-xs text-muted-foreground">{selectedBatch.supplier.contact}</div>
                  ) : null}
                  {selectedBatch.supplier?.email ? (
                    <div className="text-xs text-muted-foreground">{selectedBatch.supplier.email}</div>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Quantity</div>
                    <div className="font-medium tabular-nums">{selectedBatch.quantity.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Purchase price</div>
                    <div className="font-medium tabular-nums">
                      {currencyFormatter.format(Number(selectedBatch.purchasePrice ?? 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Selling price</div>
                    <div className="font-medium tabular-nums">
                      {currencyFormatter.format(Number(selectedBatch.sellingPrice ?? 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Created</div>
                    <div className="font-medium text-foreground">
                      {selectedBatch.createdAt ? new Date(selectedBatch.createdAt).toLocaleString() : "—"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Expiry</div>
                  {(() => {
                    const expiry = new Date(selectedBatch.expiryDate);
                    if (Number.isNaN(expiry.getTime())) {
                      return <div className="font-medium text-foreground">—</div>;
                    }
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const expired = expiry < today;
                    return (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{dateFormatter.format(expiry)}</span>
                        <Badge variant={expired ? "destructive" : "outline"} className="text-xs uppercase">
                          {expired ? "Expired" : "Active"}
                        </Badge>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No batch details available.</div>
            )}
          </div>
          <DrawerFooterSection>
            {selectedBatch ? (
              <Button
                variant="outline"
                onClick={() => {
                  setViewOpen(false);
                  setEditingId(selectedBatch.id);
                  setDialogOpen(true);
                }}
              >
                <IconPencil className="mr-2 size-4" />
                Edit batch
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


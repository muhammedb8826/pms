"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconFileDownload,
  IconPencil,
  IconPlus,
  IconSettings,
  IconUpload,
} from "@tabler/icons-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { DashboardDataTable } from "@/components/dashboard-data-table";
import {
  handleApiError,
  handleApiSuccess,
} from "@/lib/utils/api-error-handler";
import {
  useProducts,
  useDeleteProduct,
} from "@/features/product/hooks/useProducts";
import {
  useImportProductsMutation,
  useLazyDownloadProductTemplateQuery,
} from "@/features/product/api/productApi";
import type { Product } from "@/features/product/types";
import {
  convertFromBase,
  formatQuantityWithUom,
} from "@/features/uom/utils/uomConversion";
import { resolveImageUrl } from "@/lib/utils/image-url";
import { ProductBinCard } from "@/features/product/components/ProductBinCard";

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ProductsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { products, total, loading, error, refetch } = useProducts(
    page,
    pageSize,
    {
      search,
      sortBy,
      sortOrder,
    }
  );
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize) || 1),
    [total, pageSize]
  );

  const deleteMutation = useDeleteProduct();
  const [importProducts, { isLoading: isImporting }] =
    useImportProductsMutation();
  const [downloadTemplate, { isLoading: isDownloadingTemplate }] =
    useLazyDownloadProductTemplateQuery();

  const handleEdit = useCallback(
    (product: Product) => {
      router.push(`/products/${product.id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const result = await deleteMutation.mutateAsync(id);
        if (
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error
        ) {
          handleApiError(result.error, {
            defaultMessage: "Failed to delete product",
          });
          return;
        }
        setConfirmDeleteId(null);
        refetch();
        handleApiSuccess("Product deleted successfully");
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to delete product" });
      }
    },
    [deleteMutation, refetch]
  );

  const columns = useMemo<ColumnDef<Product>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{product.name}</span>
              {product.genericName ? (
                <span className="text-xs text-muted-foreground">
                  {product.genericName}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.category?.name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "manufacturer",
        header: "Manufacturer",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.manufacturer?.name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "defaultUom",
        header: "Default UOM",
        cell: ({ row }) => {
          const uom = row.original.defaultUom;
          if (!uom)
            return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <span className="text-sm text-muted-foreground">
              {uom.name}
              {uom.abbreviation ? ` (${uom.abbreviation})` : ""}
            </span>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row }) => {
          const product = row.original;
          const quantityInBase = product.quantity ?? 0;
          // Convert to default UOM if available, otherwise show in base UOM
          const displayQuantity = product.defaultUom
            ? convertFromBase(quantityInBase, product.defaultUom)
            : quantityInBase;
          const displayText = formatQuantityWithUom(
            displayQuantity,
            product.defaultUom,
            2
          );
          return (
            <div className="text-right text-sm font-medium tabular-nums">
              {displayText}
            </div>
          );
        },
      },
      {
        accessorKey: "purchasePrice",
        header: () => <div className="hidden text-right lg:block">Buy</div>,
        cell: ({ row }) => (
          <div className="hidden text-right text-sm text-muted-foreground tabular-nums lg:block">
            {currencyFormatter.format(Number(row.original.purchasePrice ?? 0))}
          </div>
        ),
      },
      {
        accessorKey: "sellingPrice",
        header: () => <div className="text-right">Sell</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            {currencyFormatter.format(Number(row.original.sellingPrice ?? 0))}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status?.toLowerCase() === "active"
                ? "default"
                : "outline"
            }
          >
            {row.original.status ?? "—"}
          </Badge>
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
          const product = row.original;
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
                    aria-label="Open product actions"
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
                    onSelect={() =>
                      router.push(`/products/${product.id}/bin-card`)
                    }
                  >
                    View Bin Card
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleEdit(product);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Edit product
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      // Prevent row click by temporarily disabling pointer events on the row
                      const target = event.target as HTMLElement;
                      const row = target.closest("tr");
                      if (row) {
                        (row as HTMLElement).style.pointerEvents = "none";
                        setTimeout(() => {
                          (row as HTMLElement).style.pointerEvents = "";
                        }, 100);
                      }
                      setConfirmDeleteId(product.id);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Prevent row click by temporarily disabling pointer events on the row
                      const target = e.target as HTMLElement;
                      const row = target.closest("tr");
                      if (row) {
                        (row as HTMLElement).style.pointerEvents = "none";
                        setTimeout(() => {
                          (row as HTMLElement).style.pointerEvents = "";
                        }, 100);
                      }
                      setConfirmDeleteId(product.id);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Delete product
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [handleEdit]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      try {
        if (!/\.(xlsx|xls)$/i.test(file.name)) {
          toast.error("Please select an Excel file (.xlsx or .xls)");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File size must be less than 10MB");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }
        const result = await importProducts(file).unwrap();
        setImportResult({
          success: result.success || 0,
          failed: result.failed || 0,
          errors: result.errors || [],
        });
        if (result.success > 0) {
          handleApiSuccess(
            `Successfully imported ${result.success} product${
              result.success === 1 ? "" : "s"
            }`
          );
        }
        if (result.failed > 0 || (result.errors && result.errors.length > 0)) {
          setShowImportDialog(true);
        }
        if (result.success > 0) {
          refetch();
        }
      } catch (err) {
        handleApiError(err, { defaultMessage: "Import failed" });
      } finally {
        // Use ref instead of event.currentTarget to avoid null reference errors
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [importProducts, refetch]
  );

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const { data: blob } = await downloadTemplate();
      if (!blob) {
        handleApiError(new Error("Template not available"), {
          defaultMessage: "Template not available",
        });
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "product-import-template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      handleApiError(err, { defaultMessage: "Failed to download template" });
    }
  }, [downloadTemplate]);

  const renderDetails = useCallback((product: Product) => {
    return (
      <div className="space-y-6">
        {product.image ? (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-2 text-xs text-muted-foreground">
              Product image
            </div>
            <div className="relative aspect-square w-full overflow-hidden rounded-md bg-background">
              <Image
                fill
                src={resolveImageUrl(product.image) || "/placeholder-image.png"}
                alt={product.name}
                className="object-contain"
              />
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Category</div>
            <div className="font-medium text-foreground">
              {product.category?.name ?? "—"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Manufacturer</div>
              <div className="font-medium text-foreground">
                {product.manufacturer?.name ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Default UOM</div>
              <div className="font-medium text-foreground">
                {product.defaultUom
                  ? `${product.defaultUom.name}${
                      product.defaultUom.abbreviation
                        ? ` (${product.defaultUom.abbreviation})`
                        : ""
                    }`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Quantity</div>
              <div className="font-medium tabular-nums">
                {(() => {
                  const quantityInBase = product.quantity ?? 0;
                  const displayQuantity = product.defaultUom
                    ? convertFromBase(quantityInBase, product.defaultUom)
                    : quantityInBase;
                  return formatQuantityWithUom(
                    displayQuantity,
                    product.defaultUom,
                    2
                  );
                })()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Min level</div>
              <div className="font-medium tabular-nums">
                {product.minLevel ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Purchase price
              </div>
              <div className="font-medium tabular-nums">
                {currencyFormatter.format(Number(product.purchasePrice ?? 0))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Selling price</div>
              <div className="font-medium tabular-nums">
                {currencyFormatter.format(Number(product.sellingPrice ?? 0))}
              </div>
            </div>
          </div>

          {/* NEW: Bin Card Section */}
          <div className="mt-6 pt-6 border-t">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Stock Movement History (Bin Card)
              </h3>
              <Badge variant="outline">Ledger</Badge>
            </div>

            {/* Render the Bin Card component here */}
            <div className="rounded-md border bg-card">
              <ProductBinCard productId={product?.id || ""} />
            </div>
          </div>

          {product.description ? (
            <div>
              <div className="mb-1 text-xs text-muted-foreground">
                Description
              </div>
              <p className="whitespace-pre-wrap text-foreground">
                {product.description}
              </p>
            </div>
          ) : null}
        </div>
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
            <h1 className="text-xl font-semibold">Products</h1>
            <p className="text-sm text-muted-foreground">
              Manage your product catalogue, pricing, and availability.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total products: {total}
            </p>
          </div>
          <Button onClick={() => router.push("/products/new")}>
            <IconPlus className="mr-2 size-4" />
            Add Product
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={products}
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
          emptyMessage="No products found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(product) => product.name}
          detailsDescription={(product) => product.genericName || ""}
          renderDetailsFooter={(product, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                // Use setTimeout to ensure drawer closes before navigation
                setTimeout(() => {
                  router.push(`/products/${product.id}/edit`);
                }, 0);
              }}
              className="w-full"
            >
              <IconPencil className="mr-2 size-4" />
              Edit Product
            </Button>
          )}
          headerFilters={
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search products..."
                className="w-full min-w-0 sm:w-56"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value || "name");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="genericName">Generic</SelectItem>
                  <SelectItem value="purchasePrice">Purchase price</SelectItem>
                  <SelectItem value="sellingPrice">Selling price</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="createdAt">Created</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value) => {
                  const next =
                    (value?.toUpperCase() as "ASC" | "DESC") || "ASC";
                  setSortOrder(next);
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
          headerActions={
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportChange}
              />
              <Button
                variant="outline"
                onClick={handleImportClick}
                disabled={isImporting}
              >
                <IconUpload className="mr-2 size-4" />
                {isImporting ? "Importing..." : "Import"}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
              >
                <IconFileDownload className="mr-2 size-4" />
                {isDownloadingTemplate ? "Downloading..." : "Template"}
              </Button>
            </div>
          }
        />
      </div>

      {/* Import Results Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertHeader>
            <AlertDialogTitle>Import Results</AlertDialogTitle>
            {importResult && (
              <AlertDesc>
                Import completed with {importResult.success} successful and{" "}
                {importResult.failed} failed.
              </AlertDesc>
            )}
          </AlertHeader>
          {importResult && (
            <div className="space-y-4 mt-4">
              <div className="flex gap-4">
                <div className="flex-1 rounded-lg border bg-green-50 dark:bg-green-950/20 p-3">
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">
                    Successfully Imported
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {importResult.success}
                  </div>
                </div>
                <div className="flex-1 rounded-lg border bg-red-50 dark:bg-red-950/20 p-3">
                  <div className="text-sm font-medium text-red-900 dark:text-red-100">
                    Failed
                  </div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {importResult.failed}
                  </div>
                </div>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Errors:</div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-sm text-muted-foreground p-2 rounded bg-muted"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <AlertFooter>
            <AlertDialogAction onClick={() => setShowImportDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete{" "}
            {confirmDeleteId &&
            products.find((p) => p.id === confirmDeleteId) ? (
              <span className="font-medium">
                {products.find((p) => p.id === confirmDeleteId)?.name}
              </span>
            ) : (
              "this product"
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

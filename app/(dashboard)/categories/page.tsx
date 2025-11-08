"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconFilePlus,
  IconPencil,
  IconSettings,
  IconTrash,
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
import { useCategories, useCategory, useDeleteCategory } from "@/features/category/hooks/useCategories";
import type { Category } from "@/features/category/types";
import { CategoryForm } from "@/features/category/components/CategoryForm";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export default function CategoriesPage() {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { categories, total, loading, error, refetch } = useCategories(page, pageSize, {
    search,
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
  const [editing, setEditing] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewQuery = useCategory(viewId ?? undefined);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteCategory();

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess("Category deleted successfully");
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to delete category" });
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteMutation, refetch],
  );

  const handleView = useCallback((category: Category) => {
    setViewId(category.id);
    setViewOpen(true);
  }, []);

  const handleEdit = useCallback((category: Category) => {
    setEditing(category);
    setDialogOpen(true);
  }, []);

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

  const columns = useMemo<ColumnDef<Category>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "Category",
        cell: ({ row }) => {
          const category = row.original;
          return (
            <button
              type="button"
              onClick={() => handleView(category)}
              className="text-left text-sm font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {category.name}
            </button>
          );
        },
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
        accessorKey: "products",
        header: () => <div className="text-right">Products</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            {row.original.products ? row.original.products.length : 0}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="hidden text-right lg:block">Created</div>,
        cell: ({ row }) => (
          <div className="hidden text-right text-sm text-muted-foreground lg:block">
            {row.original.createdAt ? dateFormatter.format(new Date(row.original.createdAt)) : "—"}
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
          const category = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open category actions"
                  >
                    <IconDotsVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleView(category);
                    }}
                  >
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleEdit(category);
                    }}
                  >
                    Edit category
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setConfirmDeleteId(category.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete category
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [handleEdit, handleView]);

  return (
    <div className="flex flex-col gap-4 overflow-x-hidden p-4">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Categories</h1>
            <p className="text-sm text-muted-foreground">
              Organize products into categories for easier navigation and reporting.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Total categories: {total}</p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <IconFilePlus className="mr-2 size-4" />
            Add Category
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Search categories..."
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
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="updatedAt">Updated</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortOrder}
            onValueChange={(value) => {
              setSortOrder((value || "asc") as "asc" | "desc");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {typeof error === "string" ? error : "Failed to load categories."}
          </div>
        ) : null}

        <ListDataTable
          columns={columns}
          data={categories}
          loading={loading}
          pageIndex={page - 1}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          emptyMessage="No categories found"
        />
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setFormError(null);
            setFormSubmitting(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editing}
            onSuccess={() => {
              setDialogOpen(false);
              setEditing(null);
              refetch();
              handleApiSuccess(editing ? "Category updated successfully" : "Category created successfully");
            }}
            onCancel={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
            onErrorChange={setFormError}
            onSubmittingChange={setFormSubmitting}
            formId="category-form"
            hideActions
          />
          <div className="mt-4 flex items-center justify-between">
            {formError ? <span className="text-xs text-destructive">{formError}</span> : <span />}
            <div className="flex gap-2">
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
              <Button type="submit" form="category-form" disabled={formSubmitting}>
                {formSubmitting ? "Saving…" : editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
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
        <DrawerContent className="max-h-[95vh] sm:max-w-md">
          <DrawerHeaderSection className="gap-1">
            <DrawerTitle>{viewQuery.data?.name ?? "Category details"}</DrawerTitle>
            {viewQuery.data?.description ? (
              <DrawerDescription>{viewQuery.data.description}</DrawerDescription>
            ) : null}
          </DrawerHeaderSection>
          <div className="space-y-6 px-4 pb-4">
            {viewQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : viewQuery.error ? (
              <div className="text-sm text-destructive">
                {viewQuery.error instanceof Error ? viewQuery.error.message : "Failed to load category"}
              </div>
            ) : viewQuery.data ? (
              <>
                <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="font-medium text-foreground">{viewQuery.data.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Description</div>
                    <div className="text-foreground">{viewQuery.data.description ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Created</div>
                    <div className="text-foreground">
                      {viewQuery.data.createdAt ? dateFormatter.format(new Date(viewQuery.data.createdAt)) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Last updated</div>
                    <div className="text-foreground">
                      {viewQuery.data.updatedAt ? dateFormatter.format(new Date(viewQuery.data.updatedAt)) : "—"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Products ({viewQuery.data.products?.length ?? 0})
                    </span>
                    <Badge variant="outline">{viewQuery.data.products?.length ?? 0}</Badge>
                  </div>
                  {viewQuery.data.products && viewQuery.data.products.length > 0 ? (
                    <ul className="grid gap-3 rounded-lg border bg-background p-3 text-sm">
                      {viewQuery.data.products.map((product) => (
                        <li key={product.id}>
                          <div className="font-medium text-foreground">{product.name}</div>
                          {product.description ? (
                            <div className="text-xs text-muted-foreground">{product.description}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No products assigned to this category yet.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No category details available.</div>
            )}
          </div>
          <DrawerFooterSection>
            {viewQuery.data ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewOpen(false);
                    setEditing(viewQuery.data ?? null);
                    setDialogOpen(true);
                  }}
                >
                  <IconPencil className="mr-2 size-4" />
                  Edit category
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewOpen(false);
                    if (viewQuery.data?.id) {
                      setConfirmDeleteId(viewQuery.data.id);
                    }
                  }}
                >
                  <IconTrash className="mr-2 size-4" />
                  Delete category
                </Button>
              </div>
            ) : null}
            <DrawerClose asChild>
              <Button variant="secondary">Close</Button>
            </DrawerClose>
          </DrawerFooterSection>
        </DrawerContent>
      </Drawer>

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
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this category. Products linked to it will keep their record but will no
            longer reference this category.
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


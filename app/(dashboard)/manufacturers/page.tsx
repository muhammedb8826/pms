"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconFilePlus,
  IconPencil,
  IconSettings,
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
import { DashboardDataTable } from "@/components/dashboard-data-table";
import {
  useManufacturers,
  useDeleteManufacturer,
  useCreateManufacturer,
} from "@/features/manufacturer/hooks/useManufacturers";
import type { Manufacturer } from "@/features/manufacturer/types";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

export default function ManufacturersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const { manufacturers, total, loading, error, refetch } = useManufacturers(page, pageSize, {
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
  const [formState, setFormState] = useState<{ name: string; contact?: string; address?: string }>({
    name: "",
    contact: "",
    address: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const createMutation = useCreateManufacturer();
  const deleteMutation = useDeleteManufacturer();

  const handleEdit = useCallback((manufacturer: Manufacturer) => {
    router.push(`/manufacturers/${manufacturer.id}/edit`);
  }, [router]);

  const handleOpenCreate = useCallback(() => {
    setFormState({ name: "", contact: "", address: "" });
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!formState.name.trim()) {
        setFormError("Name is required");
        return;
      }
      setFormError(null);
      setFormSubmitting(true);

      try {
        await createMutation.mutateAsync({
          name: formState.name.trim(),
          contact: formState.contact,
          address: formState.address,
        });
        handleApiSuccess("Manufacturer created successfully");
        setDialogOpen(false);
        setFormState({ name: "", contact: "", address: "" });
        refetch();
      } catch (err) {
        const message = handleApiError(err, { defaultMessage: "Failed to save manufacturer" });
        setFormError(message);
      } finally {
        setFormSubmitting(false);
      }
    },
    [createMutation, formState.address, formState.contact, formState.name, refetch],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess("Manufacturer deleted successfully");
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to delete manufacturer" });
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteMutation, refetch],
  );

  const renderDetails = useCallback((manufacturer: Manufacturer) => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-medium text-foreground">{manufacturer.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Contact</div>
            <div className="text-foreground">{manufacturer.contact ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Address</div>
            <div className="text-foreground">{manufacturer.address ?? "—"}</div>
          </div>
        </div>
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<Manufacturer>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "Manufacturer",
        cell: ({ row }) => (
          <span className="text-sm font-semibold">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.contact || "—"}</span>
        ),
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-2">{row.original.address || "—"}</span>
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
          const manufacturer = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    aria-label="Open manufacturer actions"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconDotsVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleEdit(manufacturer);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Edit manufacturer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setConfirmDeleteId(manufacturer.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete manufacturer
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
            <h1 className="text-xl font-semibold">Manufacturers</h1>
            <p className="text-sm text-muted-foreground">
              Manage vendor details and keep contact information up to date.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Total manufacturers: {total}</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <IconFilePlus className="mr-2 size-4" />
            Add Manufacturer
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={manufacturers}
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
          emptyMessage="No manufacturers found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(manufacturer) => manufacturer.name}
          detailsDescription={(manufacturer) => manufacturer.contact || ""}
          renderDetailsFooter={(manufacturer, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  router.push(`/manufacturers/${manufacturer.id}/edit`);
                }, 0);
              }}
              className="w-full"
            >
              <IconPencil className="mr-2 size-4" />
              Edit Manufacturer
            </Button>
          )}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search manufacturers..."
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
                  <SelectItem value="createdAt">Created</SelectItem>
                  <SelectItem value="updatedAt">Updated</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value) => {
                  setSortOrder((value?.toUpperCase() as "ASC" | "DESC") || "ASC");
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setFormState({ name: "", contact: "", address: "" });
            setFormError(null);
            setFormSubmitting(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Manufacturer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                disabled={formSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact</label>
              <Input
                value={formState.contact ?? ""}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    contact: event.target.value,
                  }))
                }
                disabled={formSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                value={formState.address ?? ""}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
                disabled={formSubmitting}
              />
            </div>
            <div className="flex items-center justify-between">
              {formError ? <span className="text-xs text-destructive">{formError}</span> : <span />}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? "Saving…" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
            <AlertDialogTitle>Delete manufacturer?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this manufacturer. Any products referencing it may need updating.
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

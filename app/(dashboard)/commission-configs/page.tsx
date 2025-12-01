"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { DashboardDataTable } from "@/components/dashboard-data-table";
import {
  useCommissionConfigs,
  useCreateCommissionConfig,
  useUpdateCommissionConfig,
  useDeleteCommissionConfig,
} from "@/features/commission/hooks/useCommissionConfigs";
import { useAllUsers } from "@/features/user/hooks/useUsers";
import { useAllCategories } from "@/features/category/hooks/useCategories";
import type { CommissionConfig } from "@/features/commission/types";
import { CommissionType } from "@/features/commission/types";
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
import { FormDialog } from "@/components/form-dialog";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";
import type { User } from "@/features/user/types";
import type { Category } from "@/features/category/types";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export default function CommissionConfigsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { configs, loading, error, refetch } = useCommissionConfigs();
  const allUsersQuery = useAllUsers();
  const allCategoriesQuery = useAllCategories();
  const createMutation = useCreateCommissionConfig();
  const updateMutation = useUpdateCommissionConfig();
  const deleteMutation = useDeleteCommissionConfig();

  const users = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allUsersQuery.data as User[] | WR<User[]> | undefined;
    if (!data) return [] as User[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as User[];
  }, [allUsersQuery.data]);

  const categories = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allCategoriesQuery.data as Category[] | WR<Category[]> | undefined;
    if (!data) return [] as Category[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Category[];
  }, [allCategoriesQuery.data]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(configs.length / pageSize) || 1), [
    configs.length,
    pageSize,
  ]);
  const paginatedConfigs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return configs.slice(start, start + pageSize);
  }, [configs, page, pageSize]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess("Commission config deleted successfully");
        setConfirmDeleteId(null);
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: "Failed to delete commission config" });
      }
    },
    [deleteMutation, refetch]
  );

  const renderDetails = useCallback((config: CommissionConfig) => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Type</div>
            <div className="font-medium text-foreground">{config.type}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Rate</div>
            <div className="font-medium text-foreground">
              {config.type === CommissionType.PERCENTAGE ? `${config.rate}%` : currencyFormatter.format(config.rate)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Applies To</div>
              <div className="font-medium text-foreground">
                {config.user ? `${config.user.firstName} ${config.user.lastName}` : "All Users"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Category</div>
              <div className="font-medium text-foreground">
                {config.category ? config.category.name : "All Categories"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Min Sale Amount</div>
              <div className="font-medium text-foreground">
                {config.minSaleAmount ? currencyFormatter.format(config.minSaleAmount) : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Max Commission</div>
              <div className="font-medium text-foreground">
                {config.maxCommission ? currencyFormatter.format(config.maxCommission) : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div>
                <Badge variant={config.isActive ? "default" : "secondary"} className="text-xs">
                  {config.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          {config.notes && (
            <div>
              <div className="text-xs text-muted-foreground">Notes</div>
              <div className="text-foreground">{config.notes}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Created</div>
              <div className="font-medium text-foreground">
                {dateFormatter.format(new Date(config.createdAt))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Last Updated</div>
              <div className="font-medium text-foreground">
                {dateFormatter.format(new Date(config.updatedAt))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<CommissionConfig>[]>(() => {
    return [
      {
        accessorKey: "user",
        header: "User",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.user ? `${row.original.user.firstName} ${row.original.user.lastName}` : "All Users"}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.category ? row.original.category.name : "All Categories"}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs uppercase">
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "rate",
        header: () => <div className="text-right">Rate</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium">
            {row.original.type === CommissionType.PERCENTAGE
              ? `${row.original.rate}%`
              : currencyFormatter.format(row.original.rate)}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"} className="text-xs">
            {row.original.isActive ? "Active" : "Inactive"}
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
          const config = row.original;
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
                    aria-label="Open config actions"
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
                      setEditingId(config.id);
                      setDialogOpen(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit config
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
                      setConfirmDeleteId(config.id);
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
                      setConfirmDeleteId(config.id);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <IconTrash className="mr-2 size-4" />
                    Delete config
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, []);

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error instanceof Error ? error.message : "Failed to load commission configs"}</div>;
  }

  const editingConfig = editingId ? configs.find((c) => c.id === editingId) : null;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Commission Configurations</h1>
            <p className="text-sm text-muted-foreground">
              Configure commission rates for salespeople and product categories
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Total configs: {configs.length}</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setDialogOpen(true);
            }}
          >
            <IconFilePlus className="mr-2 size-4" />
            Add Config
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={paginatedConfigs}
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
          emptyMessage="No commission configs found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(config) =>
            `${config.user ? `${config.user.firstName} ${config.user.lastName}` : "All Users"} - ${config.category ? config.category.name : "All Categories"}`
          }
          detailsDescription={(config) =>
            `${config.type === CommissionType.PERCENTAGE ? `${config.rate}%` : currencyFormatter.format(config.rate)}`
          }
        />
      </div>

      {/* Commission Config Form Dialog */}
      <CommissionConfigFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
          }
        }}
        config={editingConfig}
        users={users}
        categories={categories}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingId(null);
          refetch();
        }}
      />

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
            <AlertDialogTitle>Delete commission config?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this commission configuration. This cannot be undone.
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

// Commission Config Form Component
function CommissionConfigFormDialog({
  open,
  onOpenChange,
  config,
  users,
  categories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: CommissionConfig | null;
  users: User[];
  categories: Category[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    userId: config?.userId || "",
    categoryId: config?.categoryId || "",
    type: config?.type || CommissionType.PERCENTAGE,
    rate: config?.rate || 0,
    minSaleAmount: config?.minSaleAmount?.toString() || "",
    maxCommission: config?.maxCommission?.toString() || "",
    isActive: config?.isActive ?? true,
    notes: config?.notes || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const createMutation = useCreateCommissionConfig();
  const updateMutation = useUpdateCommissionConfig();

  useEffect(() => {
    if (config) {
      setForm({
        userId: config.userId || "",
        categoryId: config.categoryId || "",
        type: config.type,
        rate: config.rate,
        minSaleAmount: config.minSaleAmount?.toString() || "",
        maxCommission: config.maxCommission?.toString() || "",
        isActive: config.isActive,
        notes: config.notes || "",
      });
    } else {
      setForm({
        userId: "",
        categoryId: "",
        type: CommissionType.PERCENTAGE,
        rate: 0,
        minSaleAmount: "",
        maxCommission: "",
        isActive: true,
        notes: "",
      });
    }
    setErrors({});
  }, [config, open]);

  useEffect(() => {
    setFormSubmitting(createMutation.isPending || updateMutation.isPending);
  }, [createMutation.isPending, updateMutation.isPending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (form.rate < 0) {
      setErrors({ rate: "Rate must be >= 0" });
      return;
    }

    try {
      const data = {
        userId: form.userId || undefined,
        categoryId: form.categoryId || undefined,
        type: form.type,
        rate: form.rate,
        minSaleAmount: form.minSaleAmount ? Number(form.minSaleAmount) : undefined,
        maxCommission: form.maxCommission ? Number(form.maxCommission) : undefined,
        isActive: form.isActive,
        notes: form.notes || undefined,
      };

      if (config) {
        await updateMutation.mutateAsync({ id: config.id, data });
        handleApiSuccess("Commission config updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        handleApiSuccess("Commission config created successfully");
      }
      onSuccess();
    } catch (err) {
      handleApiError(err, { defaultMessage: "Failed to save commission config" });
    }
  };

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={config ? "Edit Commission Config" : "Create Commission Config"}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">User (Optional)</label>
            <Select value={form.userId || "__all__"} onValueChange={(v) => setForm({ ...form, userId: v === "__all__" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Leave empty to apply to all users</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category (Optional)</label>
            <Select value={form.categoryId || "__all__"} onValueChange={(v) => setForm({ ...form, categoryId: v === "__all__" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Leave empty to apply to all categories</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type *</label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CommissionType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CommissionType.PERCENTAGE}>Percentage</SelectItem>
                <SelectItem value={CommissionType.FIXED}>Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Rate * ({form.type === CommissionType.PERCENTAGE ? "Percentage" : "Fixed Amount"})
            </label>
            <Input
              type="number"
              step={form.type === CommissionType.PERCENTAGE ? "0.01" : "0.01"}
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
              required
            />
            {errors.rate && <p className="text-xs text-red-600 mt-1">{errors.rate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Min Sale Amount (Optional)</label>
            <Input
              type="number"
              step="0.01"
              value={form.minSaleAmount}
              onChange={(e) => setForm({ ...form, minSaleAmount: e.target.value })}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground mt-1">Minimum sale amount to earn commission</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Commission (Optional)</label>
            <Input
              type="number"
              step="0.01"
              value={form.maxCommission}
              onChange={(e) => setForm({ ...form, maxCommission: e.target.value })}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground mt-1">Maximum commission cap per sale</p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g., Default commission for all sales"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={formSubmitting}>
            {formSubmitting ? "Saving..." : config ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </FormDialog>
  );
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});


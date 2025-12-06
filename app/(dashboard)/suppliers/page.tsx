"use client";

import React, { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { IconDotsVertical, IconFilePlus, IconPencil, IconSettings } from '@tabler/icons-react';
import { useSuppliers, useDeleteSupplier } from '@/features/supplier/hooks/useSuppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialog } from '@/components/form-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDesc,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DashboardDataTable } from '@/components/dashboard-data-table';
import SupplierForm from '@/features/supplier/components/SupplierForm';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import type { Supplier } from '@/features/supplier/types';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const { suppliers, total, loading, error, refetch } = useSuppliers(page, pageSize, { search, sortBy, sortOrder });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteSupplier();

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize) || 1), [total, pageSize]);

  const editingSupplier = useMemo(() => {
    return editingId ? suppliers.find((s) => s.id === editingId) ?? null : null;
  }, [editingId, suppliers]);

  const handleEdit = useCallback((supplier: Supplier) => {
    setEditingId(supplier.id);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        handleApiSuccess('Supplier deleted successfully');
        refetch();
      } catch (err) {
        handleApiError(err, { defaultMessage: 'Failed to delete supplier' });
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteMutation, refetch],
  );

  const renderDetails = useCallback((supplier: Supplier) => {
    const isLicensed = supplier.supplierType === 'LICENSED';
    const licenseExpired =
      isLicensed && supplier.licenseExpiryDate
        ? new Date(supplier.licenseExpiryDate) < new Date()
        : false;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-medium text-foreground">{supplier.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Supplier Type</div>
            <div className="mt-1">
              <Badge variant={isLicensed ? 'default' : 'outline'}>
                {supplier.supplierType === 'LICENSED' ? 'Licensed' : 'Walk-in'}
              </Badge>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Contact</div>
            <div className="text-foreground">{supplier.contact || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="text-foreground">{supplier.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Address</div>
            <div className="text-foreground">{supplier.address || '—'}</div>
          </div>
          {isLicensed && (
            <>
              {supplier.licenseIssueDate && (
                <div>
                  <div className="text-xs text-muted-foreground">License Issue Date</div>
                  <div className="text-foreground">
                    {new Date(supplier.licenseIssueDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {supplier.licenseExpiryDate && (
                <div>
                  <div className="text-xs text-muted-foreground">License Expiry Date</div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">
                      {new Date(supplier.licenseExpiryDate).toLocaleDateString()}
                    </span>
                    {licenseExpired && (
                      <Badge variant="destructive" className="text-xs">
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {supplier.tinNumber && (
                <div>
                  <div className="text-xs text-muted-foreground">TIN Number</div>
                  <div className="text-foreground">{supplier.tinNumber}</div>
                </div>
              )}
            </>
          )}
          <div>
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-foreground">
              {supplier.createdAt ? dateFormatter.format(new Date(supplier.createdAt)) : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Updated</div>
            <div className="text-foreground">
              {supplier.updatedAt ? dateFormatter.format(new Date(supplier.updatedAt)) : '—'}
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<Supplier>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'supplierType',
      header: 'Type',
      cell: ({ row }) => {
        const isLicensed = row.original.supplierType === 'LICENSED';
        return (
          <Badge variant={isLicensed ? 'default' : 'outline'}>
            {isLicensed ? 'Licensed' : 'Walk-in'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.contact || '—'}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.email || '—'}</span>
      ),
    },
    {
      accessorKey: 'licenseExpiryDate',
      header: 'License Expiry',
      cell: ({ row }) => {
        if (row.original.supplierType !== 'LICENSED') return <span className="text-sm text-muted-foreground">—</span>;
        if (!row.original.licenseExpiryDate) return <span className="text-sm text-muted-foreground">—</span>;
        const expiryDate = new Date(row.original.licenseExpiryDate);
        const isExpired = expiryDate < new Date();
        return (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
              {expiryDate.toLocaleDateString()}
            </span>
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => (
        <div className="flex justify-end text-muted-foreground">
          <IconSettings className="size-4" aria-hidden />
        </div>
      ),
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open actions"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground data-[state=open]:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <IconDotsVertical />
                  <span className="sr-only">Open supplier actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleEdit(supplier);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <span className="flex items-center gap-2">
                    <IconPencil className="size-4" />
                    Edit supplier
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setConfirmDeleteId(supplier.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  Delete supplier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [handleEdit]);

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
          <div>
            <h1 className="text-xl font-semibold">Suppliers</h1>
            <p className="text-sm text-muted-foreground">Manage supplier records and contact details.</p>
            <p className="mt-1 text-xs text-muted-foreground">Total suppliers: {total}</p>
          </div>
          <Button onClick={() => { setEditingId(null); setDialogOpen(true); }}>
            <IconFilePlus className="mr-2 size-4" />
            Add Supplier
          </Button>
        </div>

        <DashboardDataTable
          columns={columns}
          data={suppliers}
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
          loading={loading}
          emptyMessage="No suppliers found"
          enableColumnVisibility={true}
          renderDetails={renderDetails}
          detailsTitle={(supplier) => supplier.name}
          detailsDescription={(supplier) => supplier.email || ''}
          renderDetailsFooter={(supplier, onClose) => (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  handleEdit(supplier);
                }, 0);
              }}
              className="w-full"
            >
              <IconPencil className="mr-2 size-4" />
              Edit Supplier
            </Button>
          )}
          headerFilters={
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search..."
                className="w-full min-w-0 sm:w-48"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Select value={sortBy} onValueChange={(v) => {
                setSortBy(v || 'name');
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="supplierType">Supplier Type</SelectItem>
                  <SelectItem value="licenseExpiryDate">License Expiry</SelectItem>
                  <SelectItem value="createdAt">Created</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v) => {
                setSortOrder((v || 'ASC') as 'ASC' | 'DESC');
                setPage(1);
              }}>
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

      <FormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditingId(null);
            setFormError(null);
            setFormSubmitting(false);
          }
        }}
        title={editingId ? 'Edit Supplier' : 'Add Supplier'}
        size="2xl"
        error={formError}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingId(null);
              }}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="supplier-form" disabled={formSubmitting}>
              {formSubmitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <SupplierForm
          supplier={editingSupplier}
          onSuccess={() => {
            setDialogOpen(false);
            setEditingId(null);
            refetch();
          }}
          onCancel={() => {
            setDialogOpen(false);
            setEditingId(null);
          }}
          onErrorChange={setFormError}
          onSubmittingChange={setFormSubmitting}
          formId="supplier-form"
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
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
          </AlertHeader>
          <AlertDesc>
            This action will permanently delete this supplier. This cannot be undone.
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

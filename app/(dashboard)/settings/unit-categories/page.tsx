"use client";

import React, { useMemo, useState } from 'react';
import { UnitCategory } from '@/features/unit-category/types';
import { useUnitCategories, useDeleteUnitCategory, useUnitCategory } from '@/features/unit-category/hooks/useUnitCategories';
import { UnitCategoryForm } from '@/features/unit-category/components/UnitCategoryForm';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { IconEye, IconPencil, IconTrash, IconSettings } from '@tabler/icons-react';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Page() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const { unitCategories: rawUnitCategories, total, loading, error, refetch } = useUnitCategories(page, limit, { q: search });
  
  // Ensure unitCategories is always an array
  const unitCategories = Array.isArray(rawUnitCategories) ? rawUnitCategories : [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UnitCategory | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewQuery = useUnitCategory(viewId ?? undefined);
  const deleteMutation = useDeleteUnitCategory();

  const canNext = useMemo(() => {
    const shown = (page - 1) * limit + unitCategories.length;
    return shown < total;
  }, [unitCategories.length, total, page]);

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
      handleApiSuccess('Unit category deleted');
    } catch (err) {
      handleApiError(err, { defaultMessage: 'Failed to delete unit category' });
    }
  }

  function onFormSuccess() {
    setDialogOpen(false);
    setEditing(null);
    refetch();
  }

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex items-start justify-between gap-2 sm:items-center">
        <h1 className="text-xl font-semibold">Unit Categories</h1>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Input placeholder="Search..." className="w-full min-w-0 sm:w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>Add Unit Category</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setFormError(null); setFormSubmitting(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Unit Category' : 'Create Unit Category'}</DialogTitle>
          </DialogHeader>
          <UnitCategoryForm
            unitCategory={editing}
            onSuccess={onFormSuccess}
            onCancel={() => { setDialogOpen(false); setEditing(null); }}
            onErrorChange={setFormError}
            onSubmittingChange={setFormSubmitting}
            formId="unit-category-form"
            hideActions
          />
          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              {formError ? <span className="text-xs text-red-600">{formError}</span> : <span />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }}>Cancel</Button>
                <Button type="submit" form="unit-category-form" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unitCategories.map((uc) => (
              <TableRow key={uc.id}>
                <TableCell>{uc.name}</TableCell>
                <TableCell>{uc.description || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button aria-label="Manage UOMs" variant="ghost" size="sm" asChild>
                          <Link href={`/settings/uom?categoryId=${uc.id}`}>
                            <IconSettings />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Manage Units of Measure</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button aria-label="View" variant="ghost" size="sm" onClick={() => { setViewId(uc.id); setViewOpen(true); }}>
                          <IconEye />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button aria-label="Edit" variant="outline" size="sm" onClick={() => { setEditing(uc); setDialogOpen(true); }}>
                          <IconPencil />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button aria-label="Delete" variant="destructive" size="sm" disabled={deleteMutation.isPending}>
                              <IconTrash />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertHeader>
                          <AlertDialogTitle>Delete unit category?</AlertDialogTitle>
                        </AlertHeader>
                        <AlertDesc>
                          This action will permanently delete <span className="font-medium">{uc.name}</span>. If it has associated units of measure, deletion may fail.
                        </AlertDesc>
                        <AlertFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(uc.id)} disabled={deleteMutation.isPending}>Delete</AlertDialogAction>
                        </AlertFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) setViewId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unit Category Details</DialogTitle>
            {viewQuery.data?.id ? (
              <DialogDescription>ID: {viewQuery.data.id}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="space-y-4">
            {viewQuery.isLoading ? (
              <div>Loading…</div>
            ) : viewQuery.error ? (
              <div className="text-red-600 text-sm">{viewQuery.error instanceof Error ? viewQuery.error.message : 'Failed to load'}</div>
            ) : viewQuery.data ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="font-medium">{viewQuery.data.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Description</div>
                  <div>{viewQuery.data.description || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div>{new Date(viewQuery.data.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                  <div>{new Date(viewQuery.data.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + unitCategories.length} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}


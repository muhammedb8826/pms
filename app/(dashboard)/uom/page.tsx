"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCreateUnitOfMeasure, useDeleteUnitOfMeasure, useUnitOfMeasures, useUpdateUnitOfMeasure } from '@/features/uom/hooks/useUnitOfMeasures';

export default function UnitOfMeasuresPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const { unitOfMeasures, total, loading, error, refetch } = useUnitOfMeasures(page, limit, { search });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; name: string; abbreviation?: string; conversionRate?: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const createMutation = useCreateUnitOfMeasure();
  const updateMutation = useUpdateUnitOfMeasure();
  const deleteMutation = useDeleteUnitOfMeasure();

  const canNext = useMemo(() => ((page - 1) * limit + unitOfMeasures.length) < total, [page, limit, unitOfMeasures.length, total]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this unit of measure?');
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
      toast.success('Unit of measure deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete unit of measure';
      toast.error(message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.name?.trim()) { setFormError('Name is required'); return; }
    setFormError(null);
    setFormSubmitting(true);
    try {
      if (editing.id) {
        await updateMutation.mutateAsync({ id: editing.id, dto: { name: editing.name.trim(), abbreviation: editing.abbreviation, conversionRate: editing.conversionRate } });
        toast.success('Unit of measure updated');
      } else {
        await createMutation.mutateAsync({ name: editing.name.trim(), abbreviation: editing.abbreviation, conversionRate: editing.conversionRate });
        toast.success('Unit of measure created');
      }
      setDialogOpen(false);
      setEditing(null);
      refetch();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  }

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex items-start justify-between gap-2 sm:items-center">
        <h1 className="text-xl font-semibold">Units of Measure</h1>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Input placeholder="Search..." className="w-full min-w-0 sm:w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => { setEditing({ name: '' }); setDialogOpen(true); }}>Add Unit</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setFormError(null); setFormSubmitting(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Unit' : 'Create Unit'}</DialogTitle>
          </DialogHeader>
          {formError ? <div className="text-xs text-red-600">{formError}</div> : null}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Name *</label>
              <Input value={editing?.name ?? ''} onChange={(e) => setEditing((prev) => ({ ...(prev || { name: '' }), name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Abbreviation</label>
              <Input value={editing?.abbreviation ?? ''} onChange={(e) => setEditing((prev) => ({ ...(prev || { name: '' }), abbreviation: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Conversion Rate</label>
              <Input type="number" value={editing?.conversionRate ?? 1} onChange={(e) => setEditing((prev) => ({ ...(prev || { name: '' }), conversionRate: Number(e.target.value) }))} />
            </div>
            <DialogFooter>
              <div className="flex w-full items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }}>Cancel</Button>
                <Button type="submit" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : (editing?.id ? 'Update' : 'Create')}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Abbreviation</TableHead>
              <TableHead>Conversion</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unitOfMeasures.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.abbreviation || '-'}</TableCell>
                <TableCell>{u.conversionRate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button aria-label="View" variant="ghost" size="sm" onClick={() => { /* view optional */ }}>
                          <IconEye />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button aria-label="Edit" variant="outline" size="sm" onClick={() => { setEditing({ id: u.id, name: u.name, abbreviation: u.abbreviation, conversionRate: u.conversionRate }); setDialogOpen(true); }}>
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
                          <AlertDialogTitle>Delete unit of measure?</AlertDialogTitle>
                        </AlertHeader>
                        <AlertDesc>
                          This action will permanently delete <span className="font-medium">{u.name}</span>. If it is associated to products, deletion may fail.
                        </AlertDesc>
                        <AlertFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(u.id)} disabled={deleteMutation.isPending}>Delete</AlertDialogAction>
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + unitOfMeasures.length} of {total}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>Next</Button>
        </div>
      </div>
    </div>
  );
}



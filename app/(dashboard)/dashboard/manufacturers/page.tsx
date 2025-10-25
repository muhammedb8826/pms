"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCreateManufacturer, useDeleteManufacturer, useManufacturers, useUpdateManufacturer } from '@/hooks/useManufacturers';

export default function ManufacturersPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const { manufacturers, total, loading, error, refetch } = useManufacturers(page, limit, { search });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; name: string; contact?: string; address?: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const createMutation = useCreateManufacturer();
  const updateMutation = useUpdateManufacturer();
  const deleteMutation = useDeleteManufacturer();

  const canNext = useMemo(() => ((page - 1) * limit + manufacturers.length) < total, [page, limit, manufacturers.length, total]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this manufacturer?');
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
      toast.success('Manufacturer deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete manufacturer';
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
        await updateMutation.mutateAsync({ id: editing.id, dto: { name: editing.name.trim(), contact: editing.contact, address: editing.address } });
        toast.success('Manufacturer updated');
      } else {
        await createMutation.mutateAsync({ name: editing.name.trim(), contact: editing.contact, address: editing.address });
        toast.success('Manufacturer created');
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
        <h1 className="text-xl font-semibold">Manufacturers</h1>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Input placeholder="Search..." className="w-full min-w-0 sm:w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => { setEditing({ name: '' }); setDialogOpen(true); }}>Add Manufacturer</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setFormError(null); setFormSubmitting(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Manufacturer' : 'Create Manufacturer'}</DialogTitle>
          </DialogHeader>
          {formError ? <div className="text-xs text-red-600">{formError}</div> : null}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Name *</label>
              <Input value={editing?.name ?? ''} onChange={(e) => setEditing((prev) => ({ ...(prev || { name: '' }), name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Contact</label>
              <Input value={editing?.contact ?? ''} onChange={(e) => setEditing((prev) => ({ ...(prev || { name: '' }), contact: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <Input value={editing?.address ?? ''} onChange={(e) => setEditing((prev) => ({ ...(prev || { name: '' }), address: e.target.value }))} />
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
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manufacturers.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.contact || '-'}</TableCell>
                <TableCell>{m.address || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { /* view optional */ }}>
                      <IconEye />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditing({ id: m.id, name: m.name, contact: m.contact, address: m.address }); setDialogOpen(true); }}>
                      <IconPencil />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}>
                          <IconTrash />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertHeader>
                          <AlertDialogTitle>Delete manufacturer?</AlertDialogTitle>
                        </AlertHeader>
                        <AlertDesc>
                          This action will permanently delete <span className="font-medium">{m.name}</span>. If it is associated to products, deletion may fail.
                        </AlertDesc>
                        <AlertFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(m.id)} disabled={deleteMutation.isPending}>Delete</AlertDialogAction>
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
        <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + manufacturers.length} of {total}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>Next</Button>
        </div>
      </div>
    </div>
  );
}



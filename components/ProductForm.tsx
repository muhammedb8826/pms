"use client";

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import type { CreateProductDto, Product } from '@/types/product';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryForm } from '@/components/CategoryForm';
import { toast } from 'sonner';
import { useCreateManufacturer } from '@/hooks/useManufacturers';
import { useCreateUnitOfMeasure } from '@/hooks/useUnitOfMeasures';
import { useAllManufacturers } from '@/hooks/useManufacturers';
import { useAllUnitOfMeasures } from '@/hooks/useUnitOfMeasures';
import { useAllCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  genericName: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  manufacturerId: z.string().min(1, 'Manufacturer is required'),
  unitOfMeasureId: z.string().min(1, 'Unit of measure is required'),
  packSize: z.string().optional(),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  markupPercentage: z.coerce.number().min(0).max(100).optional(),
  quantity: z.coerce.number().min(0).optional(),
  minLevel: z.coerce.number().min(0).optional(),
  maxLevel: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
});

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}

export function ProductForm({ product, onSuccess, onCancel, formId, hideActions, onErrorChange, onSubmittingChange }: ProductFormProps) {
  const [form, setForm] = useState<CreateProductDto>({
    name: product?.name ?? '',
    genericName: product?.genericName ?? '',
    description: product?.description ?? '',
    type: product?.type ?? '',
    categoryId: product?.category?.id ?? '',
    manufacturerId: product?.manufacturer?.id ?? '',
    unitOfMeasureId: product?.unitOfMeasure?.id ?? '',
    packSize: product?.packSize ?? '',
    purchasePrice: product?.purchasePrice ?? 0,
    sellingPrice: product?.sellingPrice ?? 0,
    markupPercentage: product?.markupPercentage ?? 0,
    quantity: product?.quantity ?? 0,
    minLevel: product?.minLevel ?? 0,
    maxLevel: product?.maxLevel ?? 0,
    status: product?.status ?? 'ACTIVE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const allManufacturers = useAllManufacturers();
  const allUoms = useAllUnitOfMeasures();
  const allCategories = useAllCategories();
  const createManu = useCreateManufacturer();
  const createUom = useCreateUnitOfMeasure();
  const [openNewCategory, setOpenNewCategory] = useState(false);
  const [openNewManu, setOpenNewManu] = useState(false);
  const [openNewUom, setOpenNewUom] = useState(false);
  const [manuForm, setManuForm] = useState<{ name: string; contact?: string; address?: string }>({ name: '' });
  const [uomForm, setUomForm] = useState<{ name: string; abbreviation?: string; conversionRate?: number }>({ name: '', conversionRate: 1 });
  const [manuError, setManuError] = useState<string | null>(null);
  const [uomError, setUomError] = useState<string | null>(null);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  useEffect(() => {
    onSubmittingChange?.(createMutation.isPending || updateMutation.isPending);
  }, [createMutation.isPending, updateMutation.isPending, onSubmittingChange]);

  function setField<K extends keyof CreateProductDto>(key: K, value: CreateProductDto[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as string;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      onErrorChange?.('Please fix the highlighted errors');
      return;
    }

    try {
      if (product) {
        await updateMutation.mutateAsync({ id: product.id, dto: parsed.data });
      } else {
        await createMutation.mutateAsync(parsed.data);
      }
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      onErrorChange?.(message);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Name *</label>
          <Input value={form.name} onChange={(e) => setField('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Generic Name</label>
          <Input value={form.genericName || ''} onChange={(e) => setField('genericName', e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Category *</label>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewCategory(true)}>New</Button>
          </div>
          <Select value={form.categoryId} onValueChange={(v) => setField('categoryId', v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {(allCategories.data ?? []).map((c: { id: string; name: string }) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Manufacturer *</label>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewManu(true)}>New</Button>
          </div>
          <Select value={form.manufacturerId} onValueChange={(v) => setField('manufacturerId', v)}>
            <SelectTrigger><SelectValue placeholder="Select manufacturer" /></SelectTrigger>
            <SelectContent>
              {(allManufacturers.data ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.manufacturerId && <p className="text-xs text-red-600">{errors.manufacturerId}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Unit Of Measure *</label>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewUom(true)}>New</Button>
          </div>
          <Select value={form.unitOfMeasureId} onValueChange={(v) => setField('unitOfMeasureId', v)}>
            <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
            <SelectContent>
              {(allUoms.data ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}{u.abbreviation ? ` (${u.abbreviation})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unitOfMeasureId && <p className="text-xs text-red-600">{errors.unitOfMeasureId}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <Input value={form.type || ''} onChange={(e) => setField('type', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <Input value={form.description || ''} onChange={(e) => setField('description', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Pack Size</label>
          <Input value={form.packSize || ''} onChange={(e) => setField('packSize', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Purchase Price *</label>
          <Input type="number" value={form.purchasePrice} onChange={(e) => setField('purchasePrice', Number(e.target.value))} aria-invalid={Boolean(errors.purchasePrice)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Selling Price *</label>
          <Input type="number" value={form.sellingPrice} onChange={(e) => setField('sellingPrice', Number(e.target.value))} aria-invalid={Boolean(errors.sellingPrice)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Markup %</label>
          <Input type="number" value={form.markupPercentage ?? 0} onChange={(e) => setField('markupPercentage', Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Quantity</label>
          <Input type="number" value={form.quantity ?? 0} onChange={(e) => setField('quantity', Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Min Level</label>
          <Input type="number" value={form.minLevel ?? 0} onChange={(e) => setField('minLevel', Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Max Level</label>
          <Input type="number" value={form.maxLevel ?? 0} onChange={(e) => setField('maxLevel', Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <Input value={form.status || ''} onChange={(e) => setField('status', e.target.value)} />
        </div>
      </div>

      {hideActions ? null : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{(createMutation.isPending || updateMutation.isPending) ? 'Saving…' : (product ? 'Update' : 'Create')}</Button>
        </div>
      )}

      {/* New Category Dialog */}
      <Dialog open={openNewCategory} onOpenChange={(o) => { setOpenNewCategory(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSuccess={() => { setOpenNewCategory(false); toast.success('Category created'); }}
            onCancel={() => setOpenNewCategory(false)}
          />
        </DialogContent>
      </Dialog>

      {/* New Manufacturer Dialog */}
      <Dialog open={openNewManu} onOpenChange={(o) => { setOpenNewManu(o); if (!o) { setManuError(null); setManuForm({ name: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Manufacturer</DialogTitle>
          </DialogHeader>
          {manuError ? <div className="text-xs text-red-600">{manuError}</div> : null}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Name *</label>
              <Input value={manuForm.name} onChange={(e) => setManuForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Contact</label>
              <Input value={manuForm.contact || ''} onChange={(e) => setManuForm((f) => ({ ...f, contact: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <Input value={manuForm.address || ''} onChange={(e) => setManuForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex w-full items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewManu(false)}>Cancel</Button>
              <Button type="button" onClick={async () => {
                setManuError(null);
                if (!manuForm.name.trim()) { setManuError('Name is required'); return; }
                try {
                  const created = await createManu.mutateAsync({ name: manuForm.name.trim(), contact: manuForm.contact, address: manuForm.address });
                  toast.success('Manufacturer created');
                  setField('manufacturerId', created.id);
                  setOpenNewManu(false);
                } catch (e) {
                  setManuError(e instanceof Error ? e.message : 'Failed to create manufacturer');
                }
              }}>Create</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Unit of Measure Dialog */}
      <Dialog open={openNewUom} onOpenChange={(o) => { setOpenNewUom(o); if (!o) { setUomError(null); setUomForm({ name: '', conversionRate: 1 }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Unit of Measure</DialogTitle>
          </DialogHeader>
          {uomError ? <div className="text-xs text-red-600">{uomError}</div> : null}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Name *</label>
              <Input value={uomForm.name} onChange={(e) => setUomForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Abbreviation</label>
              <Input value={uomForm.abbreviation || ''} onChange={(e) => setUomForm((f) => ({ ...f, abbreviation: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Conversion Rate</label>
              <Input type="number" value={uomForm.conversionRate ?? 1} onChange={(e) => setUomForm((f) => ({ ...f, conversionRate: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex w-full items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewUom(false)}>Cancel</Button>
              <Button type="button" onClick={async () => {
                setUomError(null);
                if (!uomForm.name.trim()) { setUomError('Name is required'); return; }
                try {
                  const created = await createUom.mutateAsync({ name: uomForm.name.trim(), abbreviation: uomForm.abbreviation, conversionRate: uomForm.conversionRate });
                  toast.success('Unit of Measure created');
                  setField('unitOfMeasureId', created.id);
                  setOpenNewUom(false);
                } catch (e) {
                  setUomError(e instanceof Error ? e.message : 'Failed to create unit of measure');
                }
              }}>Create</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}




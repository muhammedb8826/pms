"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import type { Batch, CreateBatchDto, UpdateBatchDto } from '@/features/batch/types';
import { BatchStatus } from '@/features/batch/types';
import { useCreateBatch, useUpdateBatch } from '@/features/batch/hooks/useBatches';
import { useAllProducts } from '@/features/product/hooks/useProducts';
import { useAllSuppliers } from '@/features/supplier/hooks/useSuppliers';
import type { Product } from '@/features/product/types';
import type { Supplier } from '@/features/supplier/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import { IconChevronDown } from '@tabler/icons-react';

const schema = z.object({
  productId: z.string().min(1, 'Product is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  manufacturingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (YYYY-MM-DD)').optional().or(z.literal('')),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (YYYY-MM-DD)'),
  quantity: z.coerce.number().min(0, 'Quantity must be >= 0'),
  purchasePrice: z.coerce.number().min(0, 'Purchase price must be >= 0'),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be >= 0'),
  status: z.nativeEnum(BatchStatus).optional(),
  recalled: z.boolean().optional(),
  recallDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (YYYY-MM-DD)').optional().or(z.literal('')),
  recallReason: z.string().optional(),
  recallReference: z.string().optional(),
  quarantined: z.boolean().optional(),
  quarantineDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (YYYY-MM-DD)').optional().or(z.literal('')),
  quarantineReason: z.string().optional(),
});

export function BatchForm({
  batch,
  onSuccess,
  onCancel,
  formId,
  hideActions,
  onErrorChange,
  onSubmittingChange,
}: {
  batch?: Batch | null;
  onSuccess: () => void;
  onCancel?: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}) {
  const [form, setForm] = useState<CreateBatchDto>({
    productId: batch?.product?.id ?? '',
    supplierId: batch?.supplier?.id ?? '',
    batchNumber: batch?.batchNumber ?? '',
    manufacturingDate: batch?.manufacturingDate ?? undefined,
    expiryDate: batch?.expiryDate ?? new Date().toISOString().split('T')[0],
    quantity: batch?.quantity ?? 0,
    purchasePrice: batch?.purchasePrice ?? 0,
    sellingPrice: batch?.sellingPrice ?? 0,
    status: batch?.status ?? BatchStatus.ACTIVE,
    recalled: batch?.recalled ?? false,
    recallDate: batch?.recallDate ?? undefined,
    recallReason: batch?.recallReason ?? undefined,
    recallReference: batch?.recallReference ?? undefined,
    quarantined: batch?.quarantined ?? false,
    quarantineDate: batch?.quarantineDate ?? undefined,
    quarantineReason: batch?.quarantineReason ?? undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const productsQuery = useAllProducts();
  const suppliersQuery = useAllSuppliers();

  // Update form when batch data loads
  useEffect(() => {
    if (batch) {
      setForm({
        productId: batch.product?.id ?? '',
        supplierId: batch.supplier?.id ?? '',
        batchNumber: batch.batchNumber ?? '',
        manufacturingDate: batch.manufacturingDate ?? undefined,
        expiryDate: batch.expiryDate ?? new Date().toISOString().split('T')[0],
        quantity: batch.quantity ?? 0,
        purchasePrice: batch.purchasePrice ?? 0,
        sellingPrice: batch.sellingPrice ?? 0,
        status: batch.status ?? BatchStatus.ACTIVE,
        recalled: batch.recalled ?? false,
        recallDate: batch.recallDate ?? undefined,
        recallReason: batch.recallReason ?? undefined,
        recallReference: batch.recallReference ?? undefined,
        quarantined: batch.quarantined ?? false,
        quarantineDate: batch.quarantineDate ?? undefined,
        quarantineReason: batch.quarantineReason ?? undefined,
      });
      // Show advanced section if batch has recall/quarantine data
      if (batch.recalled || batch.quarantined || batch.manufacturingDate || batch.status !== BatchStatus.ACTIVE) {
        setShowAdvanced(true);
      }
    }
  }, [batch]);

  // Unwrap arrays from possible wrapped responses
  const products = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = productsQuery.data as Product[] | Wrapped<Product[]> | undefined;
    if (!data) return [] as Product[];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data as Product[];
    return [] as Product[];
  }, [productsQuery.data]);

  const suppliers = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = suppliersQuery.data as Supplier[] | Wrapped<Supplier[]> | undefined;
    if (!data) return [] as Supplier[];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data as Supplier[];
    return [] as Supplier[];
  }, [suppliersQuery.data]);

  const createMutation = useCreateBatch();
  const updateMutation = useUpdateBatch();

  useEffect(() => {
    onSubmittingChange?.(createMutation.isPending || updateMutation.isPending);
  }, [createMutation.isPending, updateMutation.isPending, onSubmittingChange]);

  function setField<K extends keyof CreateBatchDto>(key: K, value: CreateBatchDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      onErrorChange?.('Please fix the highlighted errors');
      return;
    }

    try {
      // Clean up empty strings for optional date fields
      const cleanedData = { ...parsed.data };
      if (cleanedData.manufacturingDate === '') delete cleanedData.manufacturingDate;
      if (cleanedData.recallDate === '') delete cleanedData.recallDate;
      if (cleanedData.quarantineDate === '') delete cleanedData.quarantineDate;
      if (cleanedData.recallReason === '') delete cleanedData.recallReason;
      if (cleanedData.recallReference === '') delete cleanedData.recallReference;
      if (cleanedData.quarantineReason === '') delete cleanedData.quarantineReason;

      if (batch) {
        const dto: UpdateBatchDto = cleanedData;
        await updateMutation.mutateAsync({ id: batch.id, dto });
        handleApiSuccess('Batch updated successfully');
      } else {
        await createMutation.mutateAsync(cleanedData as CreateBatchDto);
        handleApiSuccess('Batch created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = handleApiError(err, { defaultMessage: 'Failed to save batch' });
      onErrorChange?.(msg);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Product *</label>
          <Select value={form.productId} onValueChange={(v) => setField('productId', v || '')}>
            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.productId && <p className="text-xs text-red-600">{errors.productId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Supplier *</label>
          <Select value={form.supplierId} onValueChange={(v) => setField('supplierId', v || '')}>
            <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.supplierId && <p className="text-xs text-red-600">{errors.supplierId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Batch number *</label>
          <Input value={form.batchNumber} onChange={(e) => setField('batchNumber', e.target.value)} />
          {errors.batchNumber && <p className="text-xs text-red-600">{errors.batchNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Expiry date *</label>
          <Input type="date" value={form.expiryDate} onChange={(e) => setField('expiryDate', e.target.value)} />
          {errors.expiryDate && <p className="text-xs text-red-600">{errors.expiryDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Quantity *</label>
          <Input type="number" value={form.quantity} onChange={(e) => setField('quantity', Number(e.target.value))} />
          {errors.quantity && <p className="text-xs text-red-600">{errors.quantity}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Purchase price *</label>
          <Input type="number" step="0.01" value={form.purchasePrice} onChange={(e) => setField('purchasePrice', Number(e.target.value))} />
          {errors.purchasePrice && <p className="text-xs text-red-600">{errors.purchasePrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Selling price *</label>
          <Input type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setField('sellingPrice', Number(e.target.value))} />
          {errors.sellingPrice && <p className="text-xs text-red-600">{errors.sellingPrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Manufacturing date</label>
          <Input 
            type="date" 
            value={form.manufacturingDate || ''} 
            onChange={(e) => setField('manufacturingDate', e.target.value || undefined)} 
          />
          {errors.manufacturingDate && <p className="text-xs text-red-600">{errors.manufacturingDate}</p>}
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <Button 
          type="button" 
          variant="ghost" 
          className="w-full justify-between"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>Advanced Options</span>
          <IconChevronDown className={`size-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>
        {showAdvanced && (
          <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Status</label>
              <Select 
                value={form.status || BatchStatus.ACTIVE} 
                onValueChange={(v) => setField('status', v as BatchStatus)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={BatchStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={BatchStatus.EXPIRED}>Expired</SelectItem>
                  <SelectItem value={BatchStatus.RECALLED}>Recalled</SelectItem>
                  <SelectItem value={BatchStatus.QUARANTINED}>Quarantined</SelectItem>
                  <SelectItem value={BatchStatus.DAMAGED}>Damaged</SelectItem>
                  <SelectItem value={BatchStatus.RETURNED}>Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold">Recall Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recalled"
                  checked={form.recalled || false}
                  onChange={(e) => setField('recalled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="recalled" className="text-sm font-medium">Batch is recalled</label>
              </div>
              {form.recalled && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Recall date</label>
                    <Input 
                      type="date" 
                      value={form.recallDate || ''} 
                      onChange={(e) => setField('recallDate', e.target.value || undefined)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Recall reason</label>
                    <Input 
                      value={form.recallReason || ''} 
                      onChange={(e) => setField('recallReason', e.target.value || undefined)} 
                      placeholder="e.g., FDA recall notice #12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Recall reference</label>
                    <Input 
                      value={form.recallReference || ''} 
                      onChange={(e) => setField('recallReference', e.target.value || undefined)} 
                      placeholder="e.g., FDA-2025-12345"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold">Quarantine Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="quarantined"
                  checked={form.quarantined || false}
                  onChange={(e) => setField('quarantined', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="quarantined" className="text-sm font-medium">Batch is quarantined</label>
              </div>
              {form.quarantined && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Quarantine date</label>
                    <Input 
                      type="date" 
                      value={form.quarantineDate || ''} 
                      onChange={(e) => setField('quarantineDate', e.target.value || undefined)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Quarantine reason</label>
                    <Input 
                      value={form.quarantineReason || ''} 
                      onChange={(e) => setField('quarantineReason', e.target.value || undefined)} 
                      placeholder="e.g., Quality control investigation"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        )}
      </div>

      {!hideActions ? (
        <div className="flex justify-end gap-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit">{batch ? 'Update' : 'Create'}</Button>
        </div>
      ) : null}
    </form>
  );
}

export default BatchForm;



"use client";

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import type { CreateProductDto, Product } from '@/features/product/types';
import { useCreateProduct, useUpdateProduct } from '@/features/product/hooks/useProducts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryForm } from '@/features/category/components/CategoryForm';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import { useCreateManufacturer, useAllManufacturers } from '@/features/manufacturer/hooks/useManufacturers';
import { useCreateUnitOfMeasure, useAllUnitOfMeasures } from '@/features/uom/hooks/useUnitOfMeasures';
import { useAllCategories } from '@/features/category/hooks/useCategories';
import { useAllUnitCategories } from '@/features/unit-category/hooks/useUnitCategories';
import type { Manufacturer } from '@/features/manufacturer/types';
import type { Category } from '@/features/category/types';
import type { UnitCategory } from '@/features/unit-category/types';
import type { UnitOfMeasure } from '@/features/uom/types';
import { UnitCategoryForm } from '@/features/unit-category/components/UnitCategoryForm';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { useUploadProductImage } from '@/features/product/hooks/useProducts';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  productCode: z.string().min(1, 'Product code is required'),
  genericName: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  unitCategoryId: z.string().min(1, 'Unit category is required'),
  manufacturerId: z.string().optional(),
  defaultUomId: z.string().optional(),
  purchaseUomId: z.string().optional(),
  minLevel: z.coerce.number().min(0).optional(),
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
    productCode: product?.productCode ?? '',
    genericName: product?.genericName ?? '',
    description: product?.description ?? '',
    categoryId: product?.category?.id ?? '',
    unitCategoryId: product?.unitCategory?.id ?? '',
    manufacturerId: product?.manufacturer?.id ?? '',
    defaultUomId: product?.defaultUom?.id ?? '',
    purchaseUomId: product?.purchaseUom?.id ?? '',
    minLevel: product?.minLevel ?? 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const allManufacturers = useAllManufacturers();
  const allUoms = useAllUnitOfMeasures({ unitCategoryId: form.unitCategoryId || undefined });
  const allCategories = useAllCategories();
  const allUnitCategoriesQuery = useAllUnitCategories();
  
  // Ensure all arrays are always arrays, handling wrapped API responses
  type WrappedResponse<T> = {
    success: boolean;
    data: T;
  };
  
  const allManufacturersArray = React.useMemo(() => {
    const data = allManufacturers.data as Manufacturer[] | WrappedResponse<Manufacturer[]> | undefined;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [];
  }, [allManufacturers.data]);
  
  const allCategoriesArray = React.useMemo(() => {
    const data = allCategories.data as Category[] | WrappedResponse<Category[]> | undefined;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [];
  }, [allCategories.data]);
  
  const allUnitCategories = React.useMemo(() => {
    const data = allUnitCategoriesQuery.data as UnitCategory[] | WrappedResponse<UnitCategory[]> | undefined;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [];
  }, [allUnitCategoriesQuery.data]);
  const createManu = useCreateManufacturer();
  const createUom = useCreateUnitOfMeasure();
  const [openNewCategory, setOpenNewCategory] = useState(false);
  const [openNewManu, setOpenNewManu] = useState(false);
  const [openNewUom, setOpenNewUom] = useState(false);
  const [openNewUnitCategory, setOpenNewUnitCategory] = useState(false);
  const [manuForm, setManuForm] = useState<{ name: string; contact?: string; address?: string }>({ name: '' });
  const [uomForm, setUomForm] = useState<{ name: string; abbreviation?: string; conversionRate?: string }>({ name: '', conversionRate: '1' });
  const [manuError, setManuError] = useState<string | null>(null);
  const [uomError, setUomError] = useState<string | null>(null);
  
  // UOMs for the chosen category (handles wrapped responses and snake_case id)
  const filteredUoms = React.useMemo(() => {
    if (!form.unitCategoryId) return [] as UnitOfMeasure[];
    type WrappedResp<T> = { success?: boolean; data?: T };
    type UomWithSnake = UnitOfMeasure & { unit_category_id?: string };
    const raw = allUoms.data as UnitOfMeasure[] | WrappedResp<UnitOfMeasure[]> | undefined;
    const list: UomWithSnake[] = Array.isArray(raw)
      ? (raw as UomWithSnake[])
      : (raw && 'data' in (raw as WrappedResp<UnitOfMeasure[]>) && Array.isArray((raw as WrappedResp<UnitOfMeasure[]>).data)
          ? ((raw as WrappedResp<UnitOfMeasure[]>).data as UomWithSnake[])
          : ([] as UomWithSnake[]));
    // If backend filtered by unitCategoryId, list is already correct; keep a safe filter anyway
    return list.filter((u) =>
      u.unitCategoryId === form.unitCategoryId || u.unit_category_id === form.unitCategoryId || u.unitCategory?.id === form.unitCategoryId
    );
  }, [allUoms.data, form.unitCategoryId]);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const uploadImageMutation = useUploadProductImage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    onSubmittingChange?.(createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending);
  }, [createMutation.isPending, updateMutation.isPending, uploadImageMutation.isPending, onSubmittingChange]);

  // Create preview URL when file is selected
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

  function setField<K extends keyof CreateProductDto>(key: K, value: CreateProductDto[K]) {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      // Clear UOM selections when unit category changes
      if (key === 'unitCategoryId' && value !== f.unitCategoryId) {
        updated.defaultUomId = undefined;
        updated.purchaseUomId = undefined;
      }
      return updated;
    });
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
      let productId: string;
      
      if (product) {
        const updated = await updateMutation.mutateAsync({ id: product.id, dto: parsed.data });
        productId = updated.id;
        handleApiSuccess('Product updated successfully');
      } else {
        const created = await createMutation.mutateAsync(parsed.data);
        productId = created.id;
        handleApiSuccess('Product created successfully');
      }
      
      // Upload image if a new one was selected
      if (imageFile) {
        try {
          await uploadImageMutation.mutateAsync({ id: productId, file: imageFile });
          handleApiSuccess('Product image uploaded successfully');
        } catch (imageErr) {
          // Don't fail the whole operation if image upload fails
          handleApiError(imageErr, {
            defaultMessage: 'Product saved but image upload failed',
          });
        }
      }
      
      onSuccess();
    } catch (err: unknown) {
      const message = handleApiError(err, {
        defaultMessage: 'Failed to save product',
      });
      onErrorChange?.(message);
    }
  }

  // Get full image URL for display
  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://pms-api.qenenia.com/api/v1';
    // Remove /api/v1 from base URL and use root
    const baseUrl = apiBase.replace('/api/v1', '');
    return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Form inputs */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Name *</label>
          <Input value={form.name} onChange={(e) => setField('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Product Code *</label>
          <Input value={form.productCode} onChange={(e) => setField('productCode', e.target.value)} aria-invalid={Boolean(errors.productCode)} />
          {errors.productCode && <p className="text-xs text-red-600">{errors.productCode}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Generic Name</label>
          <Input value={form.genericName || ''} onChange={(e) => setField('genericName', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Category *</label>
          <Select 
            value={form.categoryId} 
            onValueChange={(v) => setField('categoryId', v || '')}
            footerButton={
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenNewCategory(true);
                }}
              >
                New Category
              </Button>
            }
          >
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {allCategoriesArray.map((c: { id: string; name: string }) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Manufacturer</label>
          <Select 
            value={form.manufacturerId || '__none__'} 
            onValueChange={(v) => setField('manufacturerId', v === '__none__' ? undefined : (v || undefined))}
            footerButton={
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenNewManu(true);
                }}
              >
                New Manufacturer
              </Button>
            }
          >
            <SelectTrigger><SelectValue placeholder="Select manufacturer (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {allManufacturersArray.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.manufacturerId && <p className="text-xs text-red-600">{errors.manufacturerId}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Unit Category *</label>
          <Select 
            value={form.unitCategoryId} 
            onValueChange={(v) => setField('unitCategoryId', v || '')}
            footerButton={
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenNewUnitCategory(true);
                }}
              >
                New Unit Category
              </Button>
            }
          >
            <SelectTrigger><SelectValue placeholder="Select unit category" /></SelectTrigger>
            <SelectContent>
              {allUnitCategories.map((uc) => (
                <SelectItem key={uc.id} value={uc.id}>{uc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unitCategoryId && <p className="text-xs text-red-600">{errors.unitCategoryId}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Default UOM</label>
          </div>
          <Select 
            value={form.defaultUomId || '__none__'} 
            onValueChange={(v) => setField('defaultUomId', v === '__none__' ? undefined : (v || undefined))}
            disabled={!form.unitCategoryId}
          >
            <SelectTrigger>
              <SelectValue placeholder={form.unitCategoryId ? "Select default UOM (optional)" : "Select unit category first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {filteredUoms.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}{u.abbreviation ? ` (${u.abbreviation})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Purchase UOM</label>
          </div>
          <Select 
            value={form.purchaseUomId || ''} 
            onValueChange={(v) => setField('purchaseUomId', v || undefined)}
            disabled={!form.unitCategoryId}
          >
            <SelectTrigger>
              <SelectValue placeholder={form.unitCategoryId ? "Select purchase UOM (optional)" : "Select unit category first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {filteredUoms.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}{u.abbreviation ? ` (${u.abbreviation})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium">Min Level</label>
          <Input type="number" value={form.minLevel ?? 0} onChange={(e) => setField('minLevel', Number(e.target.value))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            rows={4}
            value={form.description || ''}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>
          </div>
        </div>

        {/* Right column - Image upload */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <label className="block text-sm font-medium mb-2">Product Image</label>
            <ImageUpload
              value={imagePreviewUrl || getImageUrl(product?.image) || null}
              onChange={(file) => setImageFile(file)}
              disabled={createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending}
            />
          </div>
        </div>
      </div>

      {hideActions ? null : (
        <div className="flex justify-end gap-2 mt-4">
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
            onSuccess={() => { setOpenNewCategory(false); handleApiSuccess('Category created'); }}
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
                  const created = await createManu.mutateAsync({
                    name: manuForm.name.trim(),
                    contact: manuForm.contact,
                    address: manuForm.address,
                  });
                  handleApiSuccess('Manufacturer created');
                  setField('manufacturerId', created.id);
                  setOpenNewManu(false);
                } catch (e: unknown) {
                  const errorMsg = handleApiError(e, { defaultMessage: 'Failed to create manufacturer' });
                  setManuError(errorMsg);
                }
              }}>Create</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Unit of Measure Dialog */}
      <Dialog open={openNewUom} onOpenChange={(o) => { setOpenNewUom(o); if (!o) { setUomError(null); setUomForm({ name: '', conversionRate: '1' }); } }}>
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
              <Input type="number" value={uomForm.conversionRate ?? '1'} onChange={(e) => setUomForm((f) => ({ ...f, conversionRate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex w-full items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewUom(false)}>Cancel</Button>
              <Button type="button" onClick={async () => {
                setUomError(null);
                if (!uomForm.name.trim()) { setUomError('Name is required'); return; }
                if (!form.unitCategoryId) { setUomError('Please select a unit category first'); return; }
                try {
                  await createUom.mutateAsync({ 
                    name: uomForm.name.trim(), 
                    abbreviation: uomForm.abbreviation, 
                    conversionRate: uomForm.conversionRate || '1',
                    baseUnit: false,
                    unitCategoryId: form.unitCategoryId
                  });
                  handleApiSuccess('Unit of Measure created');
                  // Refresh UOMs list - the query will automatically refetch
                  setOpenNewUom(false);
                  setUomForm({ name: '', conversionRate: '1' });
                } catch (e: unknown) {
                  const errorMsg = handleApiError(e, { defaultMessage: 'Failed to create unit of measure' });
                  setUomError(errorMsg);
                }
              }}>Create</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Unit Category Dialog */}
      <Dialog open={openNewUnitCategory} onOpenChange={(o) => { setOpenNewUnitCategory(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Unit Category</DialogTitle>
          </DialogHeader>
          <UnitCategoryForm
            onSuccess={() => {
              setOpenNewUnitCategory(false);
              handleApiSuccess('Unit category created');
              // Refresh categories - the query will automatically refetch
            }}
            onCancel={() => setOpenNewUnitCategory(false)}
          />
        </DialogContent>
      </Dialog>
    </form>
  );
}




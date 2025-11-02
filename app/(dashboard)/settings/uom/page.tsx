"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCreateUnitOfMeasure, useDeleteUnitOfMeasure, useUnitOfMeasures, useUpdateUnitOfMeasure } from '@/features/uom/hooks/useUnitOfMeasures';
import { useAllUnitCategories, useUnitCategory } from '@/features/unit-category/hooks/useUnitCategories';
import type { UnitCategory } from '@/features/unit-category/types';

export default function UnitOfMeasuresPage() {
  const searchParams = useSearchParams();
  const categoryIdFromQuery = searchParams.get('categoryId');
  
  const [page, setPage] = useState(1);
  const limit = 1000; // Show all for category-specific view
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categoryIdFromQuery || '');
  const isCategorySpecificView = Boolean(categoryIdFromQuery);
  
  const { unitOfMeasures: rawUnitOfMeasures, total, loading, error, refetch } = useUnitOfMeasures(
    isCategorySpecificView ? 1 : page, 
    isCategorySpecificView ? limit : 10, 
    { q: search, unitCategoryId: selectedCategoryId || undefined }
  );
  
  // Ensure unitOfMeasures is always an array
  const unitOfMeasures = useMemo(
    () => Array.isArray(rawUnitOfMeasures) ? rawUnitOfMeasures : [],
    [rawUnitOfMeasures]
  );
  const allUnitCategoriesQuery = useAllUnitCategories();
  const categoryQuery = useUnitCategory(categoryIdFromQuery || undefined);
  const categoryName = categoryQuery.data?.name || '';
  
  // Get categories array - ensure it's always an array, handling wrapped API responses
  const allUnitCategories = useMemo(() => {
    type WrappedResponse<T> = {
      success: boolean;
      data: T;
    };
    const data = allUnitCategoriesQuery.data as UnitCategory[] | WrappedResponse<UnitCategory[]> | undefined;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [];
  }, [allUnitCategoriesQuery.data]);
  
  // Create lookup map for category names (in case API doesn't include relation)
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(allUnitCategories)) {
      allUnitCategories.forEach(cat => {
        if (cat?.id && cat?.name) {
          map.set(cat.id, cat.name);
        }
      });
    }
    return map;
  }, [allUnitCategories]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editing, setEditing] = useState<{ 
    id?: string; 
    name: string; 
    abbreviation?: string; 
    conversionRate?: string;
    baseUnit?: boolean;
    unitCategoryId?: string;
  } | null>(null);

  // Initialize category when coming from query param
  useEffect(() => {
    if (categoryIdFromQuery && !editing?.unitCategoryId) {
      setEditing((prev) => ({ ...(prev || { name: '' }), unitCategoryId: categoryIdFromQuery }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryIdFromQuery]);
  
  // Get all UOMs for the selected category to check base unit constraint
  const allUomsInCategory = useMemo(() => {
    if (!editing?.unitCategoryId) return null;
    // Filter from current page data - in production, you might want to fetch all
    return unitOfMeasures.filter((uom) => uom.unitCategoryId === editing.unitCategoryId);
  }, [editing?.unitCategoryId, unitOfMeasures]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const createMutation = useCreateUnitOfMeasure();
  const updateMutation = useUpdateUnitOfMeasure();
  const deleteMutation = useDeleteUnitOfMeasure();

  const canNext = useMemo(() => ((page - 1) * limit + unitOfMeasures.length) < total, [page, limit, unitOfMeasures.length, total]);

  // Find existing base unit in the selected category
  const existingBaseUnit = useMemo(() => {
    if (!editing?.unitCategoryId || !allUomsInCategory) return null;
    return allUomsInCategory.find(
      (uom) => uom.baseUnit && uom.id !== editing.id
    );
  }, [editing?.unitCategoryId, editing?.id, allUomsInCategory]);

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
    if (!editing.unitCategoryId) { setFormError('Unit category is required'); return; }
    if (!editing.conversionRate) { setFormError('Conversion rate is required'); return; }
    setFormError(null);
    setFormSubmitting(true);
    try {
      if (editing.id) {
        await updateMutation.mutateAsync({ 
          id: editing.id, 
          dto: { 
            name: editing.name.trim(), 
            abbreviation: editing.abbreviation,
            conversionRate: editing.conversionRate,
            baseUnit: editing.baseUnit ?? false,
            unitCategoryId: editing.unitCategoryId
          } 
        });
        toast.success('Unit of measure updated');
      } else {
        await createMutation.mutateAsync({ 
          name: editing.name.trim(), 
          abbreviation: editing.abbreviation, 
          conversionRate: editing.conversionRate,
          baseUnit: editing.baseUnit ?? false,
          unitCategoryId: editing.unitCategoryId
        });
        toast.success('Unit of measure created');
      }
      if (isCategorySpecificView) {
        setShowInlineForm(false);
        setEditing({ name: '', unitCategoryId: categoryIdFromQuery || undefined });
      } else {
        setDialogOpen(false);
        setEditing(null);
      }
      refetch();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  }

  // Wait for categories to load if needed for display
  const categoriesLoading = allUnitCategoriesQuery.isLoading;
  const categoriesError = allUnitCategoriesQuery.error;
  
  if (loading || categoriesLoading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  
  // Log for debugging (remove in production if needed)
  if (categoriesError && process.env.NODE_ENV === 'development') {
    console.warn('Categories query error:', categoriesError);
  }

  // Render form component (used in both modal and inline)
  const renderForm = (inline = false) => (
    <form onSubmit={handleSubmit} className={inline ? "space-y-4" : "space-y-3"}>
      {!isCategorySpecificView && !editing?.id && (
        <div>
          <label className="block text-sm font-medium">Unit Category *</label>
          <Select 
            value={editing?.unitCategoryId || ''} 
            onValueChange={(v: string | undefined) => {
              if (!v) return;
              setEditing((prev) => {
                const updated = { ...(prev || { name: '' }), unitCategoryId: v };
                if (existingBaseUnit && updated.baseUnit) {
                  updated.baseUnit = false;
                }
                return updated;
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit category" />
            </SelectTrigger>
            <SelectContent>
              {allUnitCategories.map((uc) => (
                <SelectItem key={uc.id} value={uc.id}>{uc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!editing?.unitCategoryId && formError?.includes('category') && (
            <p className="text-xs text-red-600 mt-1">Unit category is required</p>
          )}
          {existingBaseUnit && editing?.unitCategoryId && (
            <p className="text-xs text-muted-foreground mt-1">
              Current base unit: <span className="font-medium">{existingBaseUnit.name}</span>
            </p>
          )}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium">Name *</label>
        <Input value={editing?.name ?? ''} onChange={(e) => setEditing((prev) => ({ ...(prev || { name: '' }), name: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium">Abbreviation</label>
        <Input value={editing?.abbreviation ?? ''} onChange={(e) => setEditing((prev) => ({ ...(prev || { name: '' }), abbreviation: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium">Conversion Rate *</label>
        <Input 
          type="text" 
          value={editing?.conversionRate ?? '1.000000000'} 
          onChange={(e) => setEditing((prev) => ({ ...(prev || { name: '' }), conversionRate: e.target.value }))} 
          placeholder="1.000000000"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="baseUnit"
            checked={editing?.baseUnit ?? false}
            disabled={!editing?.unitCategoryId}
            onCheckedChange={(checked) => {
              if (checked && existingBaseUnit && existingBaseUnit.id !== editing?.id) {
                toast.warning(`Setting this as base unit will replace "${existingBaseUnit.name}" as the base unit for this category.`);
              }
              setEditing((prev) => {
                const updated = { ...(prev || { name: '' }), baseUnit: checked === true };
                if (checked && (!updated.conversionRate || updated.conversionRate !== '1.000000000')) {
                  updated.conversionRate = '1.000000000';
                }
                return updated;
              });
            }}
          />
          <label htmlFor="baseUnit" className="text-sm font-medium cursor-pointer">
            Base Unit
            {!editing?.unitCategoryId && (
              <span className="text-xs text-muted-foreground ml-1">(Select category first)</span>
            )}
          </label>
        </div>
        {editing?.baseUnit && (
          <p className="text-xs text-muted-foreground">
            Base units must have a conversion rate of 1.000000000. Only one base unit is allowed per category.
          </p>
        )}
      </div>
      {inline ? (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => { setShowInlineForm(false); setEditing({ name: '', unitCategoryId: categoryIdFromQuery || undefined }); }}>Cancel</Button>
          <Button type="submit" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : (editing?.id ? 'Update' : 'Create')}</Button>
        </div>
      ) : (
        <DialogFooter>
          <div className="flex w-full items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : (editing?.id ? 'Update' : 'Create')}</Button>
          </div>
        </DialogFooter>
      )}
    </form>
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">
          {isCategorySpecificView ? `Manage unit of measurements for ( ${categoryName} )` : 'Units of Measure'}
        </h1>
        {isCategorySpecificView && (
          <p className="text-sm text-muted-foreground">
            Configure units and their conversion rates. Only one base unit per category.
          </p>
        )}
      </div>
      
      {!isCategorySpecificView && (
        <div className="flex items-start justify-between gap-2 sm:items-center">
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Select 
              value={selectedCategoryId} 
              onValueChange={(v: string | undefined) => {
                setSelectedCategoryId(v || '');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {allUnitCategories.map((uc) => (
                  <SelectItem key={uc.id} value={uc.id}>{uc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Search..." className="w-full min-w-0 sm:w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button onClick={() => { setEditing({ name: '' }); setDialogOpen(true); }}>Add Unit</Button>
          </div>
        </div>
      )}

      {/* Inline form for category-specific view */}
      {isCategorySpecificView && showInlineForm && (
        <div className="rounded-md border p-4 bg-card">
          <h3 className="text-lg font-semibold mb-4">{editing?.id ? 'Edit Unit' : 'Add Unit'}</h3>
          {formError ? <div className="text-xs text-red-600 mb-3">{formError}</div> : null}
          {renderForm(true)}
        </div>
      )}

      {/* Modal dialog for general view */}
      {!isCategorySpecificView && (
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setFormError(null); setFormSubmitting(false); setEditing(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? 'Edit Unit' : 'Create Unit'}</DialogTitle>
            </DialogHeader>
            {formError ? <div className="text-xs text-red-600">{formError}</div> : null}
            {renderForm(false)}
          </DialogContent>
        </Dialog>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              {!isCategorySpecificView && <TableHead>Unit Category</TableHead>}
              <TableHead>Unit name</TableHead>
              <TableHead>Abbreviation</TableHead>
              <TableHead>Conversion rate(/Base)</TableHead>
              <TableHead>Base unit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unitOfMeasures.map((u) => (
              <TableRow key={u.id} className={u.baseUnit ? 'bg-accent/30' : ''}>
                {!isCategorySpecificView && (
                  <TableCell>
                    {((): string => {
                      const directName = u.unitCategory?.name;
                      if (directName) return directName;
                      const maybeSnake = (u as unknown as { unit_category_id?: string }).unit_category_id;
                      const catId = u.unitCategoryId || maybeSnake || u.unitCategory?.id;
                      if (catId) {
                        return (
                          categoryMap.get(catId) ||
                          (allUnitCategories.length > 0 && allUnitCategories.find(cat => cat.id === catId)?.name) ||
                          '-'
                        );
                      }
                      return '-';
                    })()}
                  </TableCell>
                )}
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.abbreviation || '-'}</TableCell>
                <TableCell>{u.conversionRate}</TableCell>
                <TableCell>
                  <Checkbox checked={u.baseUnit} disabled />
                </TableCell>
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
                        <Button 
                          aria-label="Edit" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { 
                            setEditing({ id: u.id, name: u.name, abbreviation: u.abbreviation, conversionRate: u.conversionRate, baseUnit: u.baseUnit, unitCategoryId: u.unitCategoryId });
                            if (isCategorySpecificView) {
                              setShowInlineForm(true);
                            } else {
                              setDialogOpen(true);
                            }
                          }}
                        >
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

      {/* Add row button for category-specific view */}
      {isCategorySpecificView && !showInlineForm && (
        <div className="flex justify-start">
          <Button 
            variant="outline" 
            onClick={() => {
              setEditing({ name: '', unitCategoryId: categoryIdFromQuery || undefined });
              setShowInlineForm(true);
            }}
          >
            + Add row
          </Button>
        </div>
      )}

      {!isCategorySpecificView && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + unitOfMeasures.length} of {total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm">Page {page}</span>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}


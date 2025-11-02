"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { z } from 'zod';
import type { Purchase, CreatePurchaseItemDto, CreatePurchaseDto, UpdatePurchaseDto, PurchaseStatus } from '@/features/purchase/types';
import { useCreatePurchase, useUpdatePurchase } from '@/features/purchase/hooks/usePurchases';
import { useAllSuppliers } from '@/features/supplier/hooks/useSuppliers';
import { useAllProducts } from '@/features/product/hooks/useProducts';
import { useAllUnitOfMeasures } from '@/features/uom/hooks/useUnitOfMeasures';
import type { Supplier } from '@/features/supplier/types';
import type { Product } from '@/features/product/types';
import type { UnitOfMeasure } from '@/features/uom/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconTrash } from '@tabler/icons-react';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const itemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  uomId: z.string().optional(),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.coerce.number().min(0, 'Unit cost must be at least 0'),
  totalCost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

const schema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  invoiceNo: z.string().min(1, 'Invoice number is required').max(255, 'Max 255 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'PARTIALLY_RECEIVED']).optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
});

interface PurchaseFormProps {
  purchase?: Purchase | null;
  onSuccess: () => void;
  onCancel: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}

export function PurchaseForm({ purchase, onSuccess, onCancel, formId, hideActions, onErrorChange, onSubmittingChange }: PurchaseFormProps) {
  const [supplierId, setSupplierId] = useState(purchase?.supplier?.id ?? '');
  const [invoiceNo, setInvoiceNo] = useState(purchase?.invoiceNo ?? '');
  const [date, setDate] = useState(purchase?.date ?? new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<PurchaseStatus>(purchase?.status ?? 'PENDING');
  const [notes, setNotes] = useState(purchase?.notes ?? '');
  // Initialize with at least one empty item if creating new purchase
  const [items, setItems] = useState<CreatePurchaseItemDto[]>(
    purchase?.items && purchase.items.length > 0
      ? purchase.items.map(item => ({
          productId: item.product?.id ?? '',
          uomId: item.uom?.id ?? '',
          batchNumber: item.batchNumber ?? '',
          expiryDate: item.expiryDate ?? '',
          quantity: item.quantity ?? 0,
          unitCost: item.unitCost ?? 0,
          totalCost: item.totalCost ?? 0,
          notes: item.notes || undefined,
        }))
      : [{
          productId: '',
          batchNumber: '',
          expiryDate: '',
          quantity: 1,
          unitCost: 0,
        }]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<number, Record<string, string>>>({});

  const allSuppliersQuery = useAllSuppliers();
  const allSuppliers = useMemo(() => {
    type WrappedResponse<T> = { success?: boolean; data?: T };
    const data = allSuppliersQuery.data as Supplier[] | WrappedResponse<Supplier[]> | undefined;
    if (!data) return [] as Supplier[];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data;
    return [] as Supplier[];
  }, [allSuppliersQuery.data]);

  const allProductsQuery = useAllProducts();
  const allProducts = useMemo(() => {
    type WrappedResponse<T> = { success?: boolean; data?: T };
    const data = allProductsQuery.data as Product[] | WrappedResponse<Product[]> | undefined;
    if (!data) return [] as Product[];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data;
    return [] as Product[];
  }, [allProductsQuery.data]);

  const allUomsQuery = useAllUnitOfMeasures();
  const allUoms = useMemo(() => {
    type WrappedResponse<T> = { success?: boolean; data?: T };
    const data = allUomsQuery.data as UnitOfMeasure[] | WrappedResponse<UnitOfMeasure[]> | undefined;
    if (!data) return [] as UnitOfMeasure[];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data;
    return [] as UnitOfMeasure[];
  }, [allUomsQuery.data]);

  useEffect(() => {
    if (purchase) {
      setSupplierId(purchase.supplier?.id ?? '');
      setInvoiceNo(purchase.invoiceNo ?? '');
      setDate(purchase.date ?? new Date().toISOString().split('T')[0]);
      setStatus(purchase.status ?? 'PENDING');
      setNotes(purchase.notes ?? '');
      setItems(
        purchase.items && purchase.items.length > 0
          ? purchase.items.map(item => ({
              productId: item.product?.id ?? '',
              uomId: item.uom?.id ?? '',
              batchNumber: item.batchNumber ?? '',
              expiryDate: item.expiryDate ?? '',
              quantity: item.quantity ?? 0,
              unitCost: item.unitCost ?? 0,
              totalCost: item.totalCost ?? 0,
              notes: item.notes || undefined,
            }))
          : [{
              productId: '',
              batchNumber: '',
              expiryDate: '',
              quantity: 1,
              unitCost: 0,
            }]
      );
    }
  }, [purchase]);

  const createMutation = useCreatePurchase();
  const updateMutation = useUpdatePurchase();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isCompleted = purchase?.status === 'COMPLETED';
  const isCancelled = purchase?.status === 'CANCELLED';

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemTotal = item.totalCost ?? (Number(item.quantity) * Number(item.unitCost));
      return sum + Number(itemTotal);
    }, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [items]);

  function addItem() {
    setItems([...items, {
      productId: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 1,
      unitCost: 0,
    }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
    const newErrors = { ...itemErrors };
    delete newErrors[index];
    setItemErrors(newErrors);
  }

  function updateItem(index: number, field: keyof CreatePurchaseItemDto, value: string | number | undefined) {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'quantity') {
      item.quantity = typeof value === 'number' ? value : item.quantity;
      // Auto-calculate totalCost
      item.totalCost = item.quantity * item.unitCost;
    } else if (field === 'unitCost') {
      item.unitCost = typeof value === 'number' ? value : item.unitCost;
      // Auto-calculate totalCost
      item.totalCost = item.quantity * item.unitCost;
    } else if (field === 'productId' || field === 'batchNumber' || field === 'expiryDate') {
      item[field] = typeof value === 'string' ? value : '';
    } else if (field === 'uomId' || field === 'notes') {
      item[field] = typeof value === 'string' ? value : undefined;
    }
    
    newItems[index] = item;
    setItems(newItems);
    
    // Clear error for this field
    if (itemErrors[index]) {
      const newItemErrors = { ...itemErrors };
      newItemErrors[index] = { ...newItemErrors[index] };
      delete newItemErrors[index][field];
      setItemErrors(newItemErrors);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setItemErrors({});
    onErrorChange?.(null);

    // Validate items
    const validatedItems: CreatePurchaseItemDto[] = [];
    let hasItemErrors = false;

    items.forEach((item, index) => {
      const parsed = itemSchema.safeParse(item);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          const key = issue.path[0] as string;
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        });
        setItemErrors((prev) => ({ ...prev, [index]: fieldErrors }));
        hasItemErrors = true;
      } else {
        // Build item data matching API requirements
        const itemData: CreatePurchaseItemDto = {
          productId: parsed.data.productId,
          batchNumber: parsed.data.batchNumber,
          expiryDate: parsed.data.expiryDate,
          quantity: parsed.data.quantity,
          unitCost: parsed.data.unitCost,
          // Calculate totalCost if not provided
          totalCost: parsed.data.totalCost ?? (parsed.data.quantity * parsed.data.unitCost),
        };
        
        // Only include optional fields if they have values
        if (parsed.data.uomId && parsed.data.uomId.trim() !== '') {
          itemData.uomId = parsed.data.uomId;
        }
        if (parsed.data.notes && parsed.data.notes.trim() !== '') {
          itemData.notes = parsed.data.notes;
        }
        
        validatedItems.push(itemData);
      }
    });

    if (hasItemErrors) {
      onErrorChange?.('Please fix item errors');
      return;
    }

    const parsed = schema.safeParse({
      supplierId,
      invoiceNo,
      date,
      status,
      notes: notes || undefined,
      items: validatedItems,
    });

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
      // Build purchase data matching API requirements
      const data: CreatePurchaseDto = {
        supplierId: parsed.data.supplierId,
        invoiceNo: parsed.data.invoiceNo,
        date: parsed.data.date,
        items: validatedItems,
      };
      
      // Only include optional fields if they have values
      if (parsed.data.status) {
        data.status = parsed.data.status;
      }
      if (parsed.data.notes && parsed.data.notes.trim() !== '') {
        data.notes = parsed.data.notes;
      }
      
      if (purchase) {
        // For updates, omit items to avoid backend requiring purchaseId on nested items
        const updateData: UpdatePurchaseDto = {
          supplierId: data.supplierId,
          invoiceNo: data.invoiceNo,
          date: data.date,
        };
        if (data.status) updateData.status = data.status;
        if (data.notes) updateData.notes = data.notes;
        
        // mutateAsync will throw if the request fails
        await updateMutation.mutateAsync({ id: purchase.id, dto: updateData });
        
        // Only show success if we reached here without throwing
        handleApiSuccess('Purchase updated successfully');
      } else {
        // For creation, status defaults to PENDING if not provided
        if (!data.status) {
          data.status = 'PENDING';
        }
        
        // mutateAsync will throw if the request fails
        await createMutation.mutateAsync(data);
        
        // Only show success if we reached here without throwing
        handleApiSuccess('Purchase created successfully');
      }
      
      onSuccess();
    } catch (err: unknown) {
      // Use global error handler
      const errorMessage = handleApiError(err, {
        defaultMessage: 'Failed to save purchase',
      });
      
      // Set form error for display
      setErrors((prev) => ({ ...prev, form: errorMessage }));
      onErrorChange?.(errorMessage);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="text-red-600 text-sm">{errors.form}</div>
      )}

      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="supplierId" className="block text-sm font-medium">Supplier *</label>
            <Select 
              value={supplierId} 
              onValueChange={(v) => setSupplierId(v || '')}
              disabled={isCompleted || isCancelled}
            >
              <SelectTrigger id="supplierId" aria-invalid={Boolean(errors.supplierId)}>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {allSuppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplierId && <p className="text-xs text-red-600">{errors.supplierId}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="date" className="block text-sm font-medium">Date *</label>
            <Input 
              id="date" 
              type="date"
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              disabled={isCompleted || isCancelled}
              aria-invalid={Boolean(errors.date)} 
            />
            {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="invoiceNo" className="block text-sm font-medium">Invoice Number *</label>
            <Input 
              id="invoiceNo" 
              value={invoiceNo} 
              onChange={(e) => setInvoiceNo(e.target.value)}
              disabled={isCompleted || isCancelled}
              placeholder="Invoice number"
              aria-invalid={Boolean(errors.invoiceNo)} 
            />
            {errors.invoiceNo && <p className="text-xs text-red-600">{errors.invoiceNo}</p>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="other">Other information</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[50px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={item.productId}
                        onValueChange={(v) => updateItem(index, 'productId', v)}
                        disabled={isCompleted || isCancelled}
                      >
                        <SelectTrigger className="w-full min-w-[150px]">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {allProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {itemErrors[index]?.productId && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors[index].productId}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.batchNumber}
                        onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                        disabled={isCompleted || isCancelled}
                        placeholder="Batch number"
                        className="w-full min-w-[120px]"
                        aria-invalid={Boolean(itemErrors[index]?.batchNumber)}
                      />
                      {itemErrors[index]?.batchNumber && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors[index].batchNumber}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                        disabled={isCompleted || isCancelled}
                        className="w-full min-w-[140px]"
                        aria-invalid={Boolean(itemErrors[index]?.expiryDate)}
                      />
                      {itemErrors[index]?.expiryDate && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors[index].expiryDate}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        disabled={isCompleted || isCancelled}
                        className="w-[80px]"
                        aria-invalid={Boolean(itemErrors[index]?.quantity)}
                      />
                      {itemErrors[index]?.quantity && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors[index].quantity}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) => updateItem(index, 'unitCost', Number(e.target.value))}
                        disabled={isCompleted || isCancelled}
                        className="w-[100px]"
                        aria-invalid={Boolean(itemErrors[index]?.unitCost)}
                      />
                      {itemErrors[index]?.unitCost && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors[index].unitCost}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.uomId || ''}
                        onValueChange={(v) => updateItem(index, 'uomId', v || undefined)}
                        disabled={isCompleted || isCancelled}
                      >
                        <SelectTrigger className="w-full min-w-[120px]">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {allUoms.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}{u.abbreviation ? ` (${u.abbreviation})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number(item.totalCost ?? (item.quantity * item.unitCost)).toFixed(2)}
                        onChange={(e) => updateItem(index, 'totalCost', Number(e.target.value))}
                        disabled={isCompleted || isCancelled}
                        className="w-[100px]"
                        readOnly
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        disabled={isCompleted || isCancelled}
                        placeholder="Description"
                        className="w-full min-w-[150px]"
                      />
                    </TableCell>
                    <TableCell>
                      {!isCompleted && !isCancelled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          aria-label="Remove item"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!isCompleted && !isCancelled && (
            <Button type="button" variant="outline" onClick={addItem}>
              Add row
            </Button>
          )}
          {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="status" className="block text-sm font-medium">Status</label>
              <Select 
                value={status} 
                onValueChange={(v) => setStatus((v || 'PENDING') as PurchaseStatus)}
                disabled={isCompleted || isCancelled}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="notes" className="block text-sm font-medium">Notes</label>
            <textarea
              id="notes"
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isCompleted || isCancelled}
              placeholder="Additional notes..."
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <span className="text-sm font-medium">Total Quantity: </span>
          <span className="text-sm font-medium">{Number(totalQuantity).toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Total Amount: </span>
          <span className="text-lg font-semibold">{Number(totalAmount).toFixed(2)}</span>
        </div>
      </div>

      {hideActions ? null : (
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || isCompleted}>
            {isSubmitting ? 'Saving…' : purchase ? 'Update' : 'Create'}
          </Button>
        </div>
      )}
    </form>
  );
}

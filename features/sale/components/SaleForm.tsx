"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import type { CreateSaleDto, CreateSaleItemDto, Sale, SaleStatus, UpdateSaleDto } from '@/features/sale/types';
import { useCreateSale, useUpdateSale } from '@/features/sale/hooks/useSales';
import { useAllCustomers } from '@/features/customer/hooks/useCustomers';
import { useAllProducts } from '@/features/product/hooks/useProducts';
import { useAvailableBatchesForProduct } from '@/features/batch/hooks/useBatches';
import { usePaymentMethods } from '@/features/payment-method/hooks/usePaymentMethods';
import { useAllUsers } from '@/features/user/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer } from '@/features/customer/types';
import type { Product } from '@/features/product/types';
import type { Batch as BatchType } from '@/features/batch/types';
import type { PaymentMethod as PaymentMethodEntity } from '@/features/payment-method/types';
import type { User } from '@/features/user/types';

const itemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  batchId: z.string().min(1, 'Batch is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discount: z.number().min(0, 'Discount cannot be negative').optional(),
  totalPrice: z.number().optional(),
  notes: z.string().optional(),
});

const saleSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.custom<SaleStatus>().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
});

export type SaleFormProps = {
  sale?: Sale;
  onSuccess?: () => void;
  onCancel?: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg?: string) => void;
  onSubmittingChange?: (submitting: boolean) => void;
};

type ItemState = {
  productId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice?: number;
  notes?: string;
};

export function SaleForm({ sale, onSuccess, onCancel, formId, hideActions, onErrorChange, onSubmittingChange }: SaleFormProps) {
  const [customerId, setCustomerId] = useState(sale?.customer?.id ?? '');
  const [date, setDate] = useState(sale?.date ?? new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<SaleStatus>(sale?.status ?? 'COMPLETED');
  const [notes, setNotes] = useState(sale?.notes ?? '');
  const [paidAmount, setPaidAmount] = useState<number>(sale?.paidAmount ? Number(sale.paidAmount) : 0);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [salespersonId, setSalespersonId] = useState<string>(sale?.salespersonId ?? '');
  const [items, setItems] = useState<ItemState[]>(
    sale?.items?.length
      ? sale.items.map((it) => ({
          productId: it.product?.id ?? '',
          batchId: it.batch?.id ?? '',
          quantity: it.quantity ?? 1,
          unitPrice: Number(it.unitPrice ?? 0),
          discount: Number(it.discount ?? 0),
          totalPrice: Number(it.totalPrice ?? 0),
          notes: it.notes ?? undefined,
        }))
      : [
          {
            productId: '',
            batchId: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
          },
        ]
  );

  const [createSale] = useCreateSale();
  const [updateSale] = useUpdateSale();

  // dropdown data
  const allCustomersQuery = useAllCustomers();
  const allProductsQuery = useAllProducts();
  const { paymentMethods } = usePaymentMethods({ includeInactive: false });
  const allUsersQuery = useAllUsers();

  const customers = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allCustomersQuery.data as Customer[] | WR<Customer[]> | undefined;
    if (!data) return [] as Customer[];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Customer[];
  }, [allCustomersQuery.data]);

  const products = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allProductsQuery.data as Product[] | WR<Product[]> | undefined;
    if (!data) return [] as Product[];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Product[];
  }, [allProductsQuery.data]);

  const salespeople = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allUsersQuery.data as User[] | WR<User[]> | undefined;
    if (!data) return [] as User[];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as User[];
  }, [allUsersQuery.data]);

  const isCompleted = sale?.status === 'COMPLETED';

  useEffect(() => {
    onSubmittingChange?.(false);
  }, [onSubmittingChange]);

  function recalcItem(idx: number, draft: ItemState[]): void {
    const it = draft[idx];
    const qty = Number(it.quantity || 0);
    const price = Number(it.unitPrice || 0);
    const disc = Number(it.discount || 0);
    const total = qty * price - disc;
    draft[idx].totalPrice = Number.isFinite(total) ? Number(total) : 0;
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: '', batchId: '', quantity: 1, unitPrice: 0, discount: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem<T extends keyof ItemState>(index: number, field: T, value: ItemState[T]) {
    setItems((prev) => {
      const draft = [...prev];
      (draft[index][field] as ItemState[T]) = value;
      if (field === 'productId') {
        draft[index].batchId = '';
      }
      recalcItem(index, draft);
      return draft;
    });
  }

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.totalPrice || (Number(it.quantity) * Number(it.unitPrice) - Number(it.discount || 0))), 0);
  }, [items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onErrorChange?.(undefined);
    onSubmittingChange?.(true);
    try {
      const parsed = saleSchema.parse({ customerId, date, status, notes: notes || undefined, items });
      if (sale) {
        // Note: Batch quantity validation is handled by the backend
        // Frontend validation is shown in the ItemRow component
        const data: UpdateSaleDto = {
          date: parsed.date,
          status: parsed.status,
          notes: parsed.notes,
          items: parsed.items as CreateSaleItemDto[], // Include items for update as per guide
        };
        if (paidAmount > 0) {
          data.paidAmount = paidAmount;
        }
        if (paymentMethodId) {
          data.paymentMethodId = paymentMethodId;
        }
        if (salespersonId) {
          data.salespersonId = salespersonId;
        }
        await updateSale({ id: sale.id, data }).unwrap();
        const statusMsg = parsed.status === 'CANCELLED' && sale.status === 'COMPLETED'
          ? 'Sale cancelled and inventory restored'
          : parsed.status === 'COMPLETED' && sale.status !== 'COMPLETED'
          ? 'Sale completed and inventory deducted'
          : 'Sale updated successfully';
        handleApiSuccess(statusMsg);
      } else {
        // Note: Batch quantity validation is handled by the backend
        // Frontend validation is shown in the ItemRow component
        const dto: CreateSaleDto = {
          customerId: parsed.customerId,
          date: parsed.date,
          status: parsed.status ?? 'COMPLETED',
          notes: parsed.notes,
          items: parsed.items as CreateSaleItemDto[],
        };
        if (paidAmount > 0) {
          dto.paidAmount = paidAmount;
        }
        if (paymentMethodId) {
          dto.paymentMethodId = paymentMethodId;
        }
        if (salespersonId) {
          dto.salespersonId = salespersonId;
        }
        await createSale(dto).unwrap();
        const statusMsg = parsed.status === 'COMPLETED' ? 'Sale created and inventory deducted' : 'Sale created successfully';
        handleApiSuccess(statusMsg);
      }
      onSuccess?.();
    } catch (err) {
      const msg = handleApiError(err, { defaultMessage: 'Failed to save sale' });
      onErrorChange?.(msg);
    } finally {
      onSubmittingChange?.(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} id={formId} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer</label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: Customer) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Salesperson (Optional)</label>
              <Select value={salespersonId} onValueChange={(v) => setSalespersonId(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-assign current user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-assign current user</SelectItem>
                  {salespeople.map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={status} onValueChange={(v) => setStatus((v || 'COMPLETED') as SaleStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Paid Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={totalAmount}
                value={paidAmount || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaidAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total: {Number(totalAmount).toFixed(2)} ETB
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <Select
                value={paymentMethodId || '__none__'}
                onValueChange={(v) => setPaymentMethodId(v === '__none__' ? '' : v)}
                disabled={paidAmount === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {paymentMethods
                    .filter((pm: PaymentMethodEntity) => pm.isActive)
                    .map((pm: PaymentMethodEntity) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Required if paid amount is greater than 0
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Items</label>
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-2">Product</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit Price</th>
                    <th className="p-2">Discount</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Notes</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <ItemRow
                      key={idx}
                      index={idx}
                      value={it}
                      products={products}
                      onChange={updateItem}
                      onRemove={removeItem}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <Button type="button" variant="outline" onClick={addItem} disabled={isCompleted}>
                Add row
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Other information</label>
            <textarea
              className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Notes"
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="border rounded-md p-4">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-semibold">{Number(totalAmount).toFixed(2)}</div>
          </div>
          {!hideActions && (
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

function ItemRow({
  index,
  value,
  products,
  onChange,
  onRemove,
}: {
  index: number;
  value: ItemState;
  products: Product[];
  onChange: <T extends keyof ItemState>(index: number, field: T, value: ItemState[T]) => void;
  onRemove: (index: number) => void;
}) {
  // Use FEFO endpoint to get available batches (ACTIVE, not recalled, not quarantined, quantity > 0, not expired)
  const { batches } = useAvailableBatchesForProduct(value.productId || undefined);

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.id === value.batchId);
  }, [batches, value.batchId]);

  return (
    <tr className="border-b">
      <td className="p-2">
        <Select value={value.productId} onValueChange={(v) => onChange(index, 'productId', v || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p: Product) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-2">
        <Select value={value.batchId} onValueChange={(v) => onChange(index, 'batchId', v || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Select batch" />
          </SelectTrigger>
          <SelectContent>
            {batches.map((b: BatchType) => (
              <SelectItem key={b.id} value={b.id}>
                {b.batchNumber} (Available: {b.quantity ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBatch && (
          <div className="text-xs text-muted-foreground mt-1">
            Available: {selectedBatch.quantity ?? 0}
          </div>
        )}
      </td>
      <td className="p-2 w-24">
        <Input
          type="number"
          min={1}
          max={selectedBatch?.quantity ?? undefined}
          value={value.quantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const qty = Number(e.target.value);
            if (selectedBatch && qty > (selectedBatch.quantity ?? 0)) {
              // Show validation error but allow typing
              return;
            }
            onChange(index, 'quantity', qty);
          }}
        />
        {selectedBatch && value.quantity > (selectedBatch.quantity ?? 0) && (
          <div className="text-xs text-destructive mt-1">
            Exceeds available quantity ({selectedBatch.quantity ?? 0})
          </div>
        )}
      </td>
      <td className="p-2 w-28">
        <Input type="number" value={value.unitPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(index, 'unitPrice', Number(e.target.value))} />
      </td>
      <td className="p-2 w-24">
        <Input type="number" value={value.discount ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(index, 'discount', Number(e.target.value))} />
      </td>
      <td className="p-2 w-28">
        <Input type="number" value={Number(value.totalPrice ?? (Number(value.quantity) * Number(value.unitPrice) - Number(value.discount || 0))).toFixed(2)} readOnly />
      </td>
      <td className="p-2">
        <Input value={value.notes ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(index, 'notes', e.target.value)} placeholder="Notes" />
      </td>
      <td className="p-2">
        <Button type="button" variant="destructive" onClick={() => onRemove(index)}>Delete</Button>
      </td>
    </tr>
  );
}

export default SaleForm;



"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import type { Credit, CreateCreditDto, UpdateCreditDto, CreditType } from '@/features/credit/types';
import { CreditType as CreditTypeEnum } from '@/features/credit/types';
import { useCreateCredit, useUpdateCredit } from '@/features/credit/hooks/useCredits';
import { useGetAllSuppliersQuery } from '@/features/supplier/api/supplierApi';
import { useGetAllCustomersQuery } from '@/features/customer/api/customerApi';
import { useGetPurchasesQuery } from '@/features/purchase/api/purchaseApi';
import { useGetSalesQuery } from '@/features/sale/api/saleApi';
import type { Supplier } from '@/features/supplier/types';
import type { Customer } from '@/features/customer/types';
import type { Purchase } from '@/features/purchase/types';
import type { Sale } from '@/features/sale/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const createSchema = z.object({
  type: z.enum(['PAYABLE', 'RECEIVABLE']),
  totalAmount: z.coerce.number().min(0.01, 'Total amount must be greater than 0'),
  paidAmount: z.coerce.number().min(0, 'Paid amount must be >= 0').optional(),
  supplierId: z.string().optional(),
  customerId: z.string().optional(),
  purchaseId: z.string().optional(),
  saleId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.type === 'PAYABLE') {
    return !!data.supplierId;
  }
  return !!data.customerId;
}, {
  message: 'Supplier is required for PAYABLE credits, Customer is required for RECEIVABLE credits',
  path: ['supplierId'],
}).refine((data) => {
  if (data.paidAmount !== undefined && data.totalAmount !== undefined) {
    return data.paidAmount <= data.totalAmount;
  }
  return true;
}, {
  message: 'Paid amount cannot exceed total amount',
  path: ['paidAmount'],
});

const updateSchema = z.object({
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']).optional(),
  paidAmount: z.coerce.number().min(0).optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  notes: z.string().optional(),
});

interface CreditFormProps {
  credit?: Credit | null;
  onSuccess: () => void;
  onCancel: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}

export function CreditForm({
  credit,
  onSuccess,
  onCancel,
  formId,
  hideActions,
  onErrorChange,
  onSubmittingChange,
}: CreditFormProps) {
  const [type, setType] = useState<CreditType>(credit?.type || CreditTypeEnum.PAYABLE);
  const [totalAmount, setTotalAmount] = useState(credit ? parseFloat(credit.totalAmount) : 0);
  const [paidAmount, setPaidAmount] = useState(credit ? parseFloat(credit.paidAmount) : 0);
  const [supplierId, setSupplierId] = useState(credit?.supplier?.id || '');
  const [customerId, setCustomerId] = useState(credit?.customer?.id || '');
  const [purchaseId, setPurchaseId] = useState(credit?.purchase?.id || '');
  const [saleId, setSaleId] = useState(credit?.sale?.id || '');
  const [dueDate, setDueDate] = useState(
    credit?.dueDate ? credit.dueDate.split('T')[0] : ''
  );
  const [notes, setNotes] = useState(credit?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (credit) {
      setType(credit.type);
      setTotalAmount(parseFloat(credit.totalAmount));
      setPaidAmount(parseFloat(credit.paidAmount));
      setSupplierId(credit.supplier?.id || '');
      setCustomerId(credit.customer?.id || '');
      setPurchaseId(credit.purchase?.id || '');
      setSaleId(credit.sale?.id || '');
      setDueDate(credit.dueDate ? credit.dueDate.split('T')[0] : '');
      setNotes(credit.notes || '');
    }
  }, [credit]);

  const suppliersQuery = useGetAllSuppliersQuery();
  const customersQuery = useGetAllCustomersQuery();
  const purchasesQuery = useGetPurchasesQuery(
    { page: 1, limit: 100, supplierId: type === CreditTypeEnum.PAYABLE ? supplierId : undefined },
    { skip: !supplierId && type === CreditTypeEnum.PAYABLE }
  );
  const salesQuery = useGetSalesQuery(
    { page: 1, limit: 100, customerId: type === CreditTypeEnum.RECEIVABLE ? customerId : undefined },
    { skip: !customerId && type === CreditTypeEnum.RECEIVABLE }
  );

  // Unwrap arrays from possible wrapped responses
  const suppliers = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = suppliersQuery.data as Supplier[] | Wrapped<Supplier[]> | undefined;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data;
    return [];
  }, [suppliersQuery.data]);

  const customers = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = customersQuery.data as Customer[] | Wrapped<Customer[]> | undefined;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data;
    return [];
  }, [customersQuery.data]);

  const purchases = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = purchasesQuery.data as { purchases?: Purchase[] } | Wrapped<{ purchases?: Purchase[] }> | undefined;
    if (!data) return [];
    if ('purchases' in data && Array.isArray(data.purchases)) return data.purchases;
    if ('data' in data && 'purchases' in data.data && Array.isArray(data.data.purchases)) {
      return data.data.purchases;
    }
    return [];
  }, [purchasesQuery.data]);

  const sales = useMemo(() => {
    type Wrapped<T> = { success?: boolean; data?: T };
    const data = salesQuery.data as { sales?: Sale[] } | Wrapped<{ sales?: Sale[] }> | undefined;
    if (!data) return [];
    if ('sales' in data && Array.isArray(data.sales)) return data.sales;
    if ('data' in data && 'sales' in data.data && Array.isArray(data.data.sales)) {
      return data.data.sales;
    }
    return [];
  }, [salesQuery.data]);

  const createMutation = useCreateCredit();
  const updateMutation = useUpdateCredit();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);

    if (credit) {
      // Update mode
      const parsed = updateSchema.safeParse({
        paidAmount: paidAmount || undefined,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
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
        await updateMutation.mutateAsync({
          id: credit.id,
          dto: parsed.data,
        });
        handleApiSuccess('Credit updated successfully');
        onSuccess();
      } catch (err: unknown) {
        const message = handleApiError(err, {
          defaultMessage: 'Failed to update credit',
        });
        setErrors((prev) => ({ ...prev, form: message }));
        onErrorChange?.(message);
      }
    } else {
      // Create mode
      const formData: CreateCreditDto = {
        type,
        totalAmount,
        paidAmount: paidAmount > 0 ? paidAmount : undefined,
        supplierId: type === CreditTypeEnum.PAYABLE ? supplierId : undefined,
        customerId: type === CreditTypeEnum.RECEIVABLE ? customerId : undefined,
        purchaseId: purchaseId || undefined,
        saleId: saleId || undefined,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      };

      const parsed = createSchema.safeParse(formData);
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
        await createMutation.mutateAsync(parsed.data);
        handleApiSuccess('Credit created successfully');
        onSuccess();
        // Reset form
        setType(CreditTypeEnum.PAYABLE);
        setTotalAmount(0);
        setPaidAmount(0);
        setSupplierId('');
        setCustomerId('');
        setPurchaseId('');
        setSaleId('');
        setDueDate('');
        setNotes('');
      } catch (err: unknown) {
        const message = handleApiError(err, {
          defaultMessage: 'Failed to create credit',
        });
        setErrors((prev) => ({ ...prev, form: message }));
        onErrorChange?.(message);
      }
    }
  }

  const isPayable = type === CreditTypeEnum.PAYABLE;

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <div className="text-red-600 text-sm">{errors.form}</div>}

      {!credit && (
        <div className="space-y-1">
          <label htmlFor="type" className="block text-sm font-medium">
            Credit Type *
          </label>
          <Select value={type} onValueChange={(v) => setType(v as CreditType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CreditTypeEnum.PAYABLE}>Payable (Owed to Supplier)</SelectItem>
              <SelectItem value={CreditTypeEnum.RECEIVABLE}>Receivable (Owed by Customer)</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-red-600">{errors.type}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!credit && (
          <>
            {isPayable ? (
              <div className="space-y-1">
                <label htmlFor="supplierId" className="block text-sm font-medium">
                  Supplier *
                </label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplierId && <p className="text-xs text-red-600">{errors.supplierId}</p>}
              </div>
            ) : (
              <div className="space-y-1">
                <label htmlFor="customerId" className="block text-sm font-medium">
                  Customer *
                </label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && <p className="text-xs text-red-600">{errors.customerId}</p>}
              </div>
            )}

            {isPayable && supplierId && (
              <div className="space-y-1">
                <label htmlFor="purchaseId" className="block text-sm font-medium">
                  Purchase (Optional)
                </label>
                <Select value={purchaseId} onValueChange={setPurchaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purchase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {purchases.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.invoiceNo || p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isPayable && customerId && (
              <div className="space-y-1">
                <label htmlFor="saleId" className="block text-sm font-medium">
                  Sale (Optional)
                </label>
                <Select value={saleId} onValueChange={setSaleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {sales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.invoiceNo || s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        <div className="space-y-1">
          <label htmlFor="totalAmount" className="block text-sm font-medium">
            Total Amount *
          </label>
          <Input
            id="totalAmount"
            type="number"
            step="0.01"
            min="0"
            value={totalAmount || ''}
            onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
            disabled={!!credit}
            aria-invalid={Boolean(errors.totalAmount)}
          />
          {errors.totalAmount && <p className="text-xs text-red-600">{errors.totalAmount}</p>}
        </div>

        {!credit && (
          <div className="space-y-1">
            <label htmlFor="paidAmount" className="block text-sm font-medium">
              Paid Amount
            </label>
            <Input
              id="paidAmount"
              type="number"
              step="0.01"
              min="0"
              value={paidAmount || ''}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              aria-invalid={Boolean(errors.paidAmount)}
            />
            {errors.paidAmount && <p className="text-xs text-red-600">{errors.paidAmount}</p>}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="dueDate" className="block text-sm font-medium">
            Due Date
          </label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes
        </label>
        <Textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about this credit..."
        />
      </div>

      {hideActions ? null : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : credit ? 'Update' : 'Create'}
          </Button>
        </div>
      )}
    </form>
  );
}


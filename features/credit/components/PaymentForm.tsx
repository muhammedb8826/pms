"use client";

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import type { Credit, RecordPaymentDto, PaymentMethod } from '@/features/credit/types';
import { PaymentMethod as PaymentMethodEnum } from '@/features/credit/types';
import { useRecordPayment } from '@/features/credit/hooks/useCredits';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.nativeEnum(PaymentMethodEnum).optional(),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});

interface PaymentFormProps {
  credit: Credit;
  onSuccess: () => void;
  onCancel: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}

export function PaymentForm({
  credit,
  onSuccess,
  onCancel,
  formId,
  hideActions,
  onErrorChange,
  onSubmittingChange,
}: PaymentFormProps) {
  const balanceAmount = parseFloat(credit.balanceAmount);
  const [amount, setAmount] = useState(balanceAmount);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethodEnum.CASH);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const recordPaymentMutation = useRecordPayment();

  const isSubmitting = recordPaymentMutation.isPending;
  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);

    const parsed = schema.safeParse({ 
      amount, 
      paymentMethod, 
      referenceNumber: referenceNumber || undefined,
      paymentDate, 
      notes 
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

    // Validate amount doesn't exceed balance
    if (amount > balanceAmount) {
      setErrors({ amount: `Payment amount cannot exceed balance (${balanceAmount.toFixed(2)})` });
      onErrorChange?.(`Payment amount cannot exceed balance (${balanceAmount.toFixed(2)})`);
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        id: credit.id,
        dto: parsed.data,
      });
      handleApiSuccess('Payment recorded successfully');
      onSuccess();
      // Reset form
      setAmount(balanceAmount);
      setPaymentMethod(PaymentMethodEnum.CASH);
      setReferenceNumber('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    } catch (err: unknown) {
      const message = handleApiError(err, {
        defaultMessage: 'Failed to record payment',
      });
      setErrors((prev) => ({ ...prev, form: message }));
      onErrorChange?.(message);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <div className="text-red-600 text-sm">{errors.form}</div>}

      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Amount:</span>
          <span className="font-medium">{credit.totalAmount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Paid Amount:</span>
          <span className="font-medium">{credit.paidAmount}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span>Balance Amount:</span>
          <span>{credit.balanceAmount}</span>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="amount" className="block text-sm font-medium">
          Payment Amount *
        </label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          max={balanceAmount}
          value={amount || ''}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          aria-invalid={Boolean(errors.amount)}
        />
        {errors.amount && <p className="text-xs text-red-600">{errors.amount}</p>}
        <p className="text-xs text-muted-foreground">
          Maximum payment: {balanceAmount.toFixed(2)}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="paymentMethod" className="block text-sm font-medium">
          Payment Method
        </label>
        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PaymentMethodEnum.CASH}>Cash</SelectItem>
            <SelectItem value={PaymentMethodEnum.BANK_TRANSFER}>Bank Transfer</SelectItem>
            <SelectItem value={PaymentMethodEnum.CHECK}>Check</SelectItem>
            <SelectItem value={PaymentMethodEnum.CREDIT_CARD}>Credit Card</SelectItem>
            <SelectItem value={PaymentMethodEnum.DEBIT_CARD}>Debit Card</SelectItem>
            <SelectItem value={PaymentMethodEnum.MOBILE_MONEY}>Mobile Money</SelectItem>
            <SelectItem value={PaymentMethodEnum.OTHER}>Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor="referenceNumber" className="block text-sm font-medium">
          Reference Number
        </label>
        <Input
          id="referenceNumber"
          type="text"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="Transaction ID, check number, etc."
        />
        <p className="text-xs text-muted-foreground">
          Optional: Transaction ID, check number, or other reference
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="paymentDate" className="block text-sm font-medium">
          Payment Date
        </label>
        <Input
          id="paymentDate"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
        />
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
          placeholder="Payment notes..."
        />
      </div>

      {hideActions ? null : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Recording…' : 'Record Payment'}
          </Button>
        </div>
      )}
    </form>
  );
}


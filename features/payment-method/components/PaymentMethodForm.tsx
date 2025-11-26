"use client";

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import type { PaymentMethod } from '@/features/payment-method/types';
import { useCreatePaymentMethod, useUpdatePaymentMethod } from '@/features/payment-method/hooks/usePaymentMethods';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  description: z.string().max(500, 'Max 500 characters').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  icon: z.string().max(100, 'Max 100 characters').optional().or(z.literal('')),
});

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod | null;
  onSuccess: () => void;
  onCancel: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}

export function PaymentMethodForm({
  paymentMethod,
  onSuccess,
  onCancel,
  formId,
  hideActions,
  onErrorChange,
  onSubmittingChange,
}: PaymentMethodFormProps) {
  const [name, setName] = useState(paymentMethod?.name ?? '');
  const [description, setDescription] = useState(paymentMethod?.description ?? '');
  const [isActive, setIsActive] = useState(paymentMethod?.isActive ?? true);
  const [icon, setIcon] = useState(paymentMethod?.icon ?? '');
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    icon?: string;
    form?: string;
  }>({});

  useEffect(() => {
    setName(paymentMethod?.name ?? '');
    setDescription(paymentMethod?.description ?? '');
    setIsActive(paymentMethod?.isActive ?? true);
    setIcon(paymentMethod?.icon ?? '');
  }, [paymentMethod]);

  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);
    const parsed = schema.safeParse({
      name,
      description: description || undefined,
      isActive,
      icon: icon || undefined,
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
      const dto = {
        name: parsed.data.name,
        description: parsed.data.description,
        isActive: parsed.data.isActive,
        icon: parsed.data.icon,
      };
      if (paymentMethod) {
        await updateMutation.mutateAsync({ id: paymentMethod.id, dto });
        handleApiSuccess('Payment method updated successfully');
      } else {
        await createMutation.mutateAsync(dto);
        handleApiSuccess('Payment method created successfully');
      }
      onSuccess();
      if (!paymentMethod) {
        setName('');
        setDescription('');
        setIsActive(true);
        setIcon('');
      }
    } catch (err: unknown) {
      const message = handleApiError(err, {
        defaultMessage: 'Failed to save payment method',
      });
      setErrors((prev) => ({ ...prev, form: message }));
      onErrorChange?.(message);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <div className="text-red-600 text-sm">{errors.form}</div>}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          Name *
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="icon" className="block text-sm font-medium">
          Icon
        </label>
        <Input
          id="icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="e.g., cash-icon, bank-icon"
          aria-invalid={Boolean(errors.icon)}
        />
        <p className="text-xs text-muted-foreground">
          Icon identifier for UI display (icon class name, icon library reference, etc.)
        </p>
        {errors.icon && <p className="text-xs text-red-600">{errors.icon}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
        />
        <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
          Active
        </Label>
        <p className="text-xs text-muted-foreground">
          Inactive payment methods won't appear in dropdowns
        </p>
      </div>

      {hideActions ? null : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : paymentMethod ? 'Update' : 'Create'}
          </Button>
        </div>
      )}
    </form>
  );
}


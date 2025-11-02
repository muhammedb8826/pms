"use client";

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/features/customer/types';
import { useCreateCustomer, useUpdateCustomer } from '@/features/customer/hooks/useCustomers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.union([z.string(), z.literal('')]).optional(),
  // Accept empty string as "no email" while still validating real emails
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  address: z.union([z.string(), z.literal('')]).optional(),
  status: z.union([z.string(), z.literal('')]).optional(),
});

export function CustomerForm({
  customer,
  onSuccess,
  onCancel,
  formId,
  hideActions,
  onErrorChange,
  onSubmittingChange,
}: {
  customer?: Customer | null;
  onSuccess: () => void;
  onCancel?: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}) {
  const [form, setForm] = useState<CreateCustomerDto>({
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    address: customer?.address ?? '',
    status: customer?.status ?? 'ACTIVE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  useEffect(() => {
    onSubmittingChange?.(createMutation.isPending || updateMutation.isPending);
  }, [createMutation.isPending, updateMutation.isPending, onSubmittingChange]);

  function setField<K extends keyof CreateCustomerDto>(key: K, value: CreateCustomerDto[K]) {
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
      if (customer) {
        const dto: UpdateCustomerDto = { name: parsed.data.name };
        if (parsed.data.phone && parsed.data.phone.trim() !== '') dto.phone = parsed.data.phone.trim();
        if (parsed.data.email && parsed.data.email.trim() !== '') dto.email = parsed.data.email.trim();
        if (parsed.data.address && parsed.data.address.trim() !== '') dto.address = parsed.data.address.trim();
        if (parsed.data.status && parsed.data.status.trim() !== '') dto.status = parsed.data.status.trim();
        await updateMutation.mutateAsync({ id: customer.id, dto });
        handleApiSuccess('Customer updated successfully');
      } else {
        const dto: CreateCustomerDto = { name: parsed.data.name };
        if (parsed.data.phone && parsed.data.phone.trim() !== '') dto.phone = parsed.data.phone.trim();
        if (parsed.data.email && parsed.data.email.trim() !== '') dto.email = parsed.data.email.trim();
        if (parsed.data.address && parsed.data.address.trim() !== '') dto.address = parsed.data.address.trim();
        if (parsed.data.status && parsed.data.status.trim() !== '') dto.status = parsed.data.status.trim();
        await createMutation.mutateAsync(dto);
        handleApiSuccess('Customer created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = handleApiError(err, { defaultMessage: 'Failed to save customer' });
      onErrorChange?.(msg);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Name *</label>
          <Input value={form.name} onChange={(e) => setField('name', e.target.value)} />
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <Input value={form.phone || ''} onChange={(e) => setField('phone', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <Input value={form.email || ''} onChange={(e) => setField('email', e.target.value)} />
          {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <Input value={form.address || ''} onChange={(e) => setField('address', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <Input value={form.status || ''} onChange={(e) => setField('status', e.target.value)} />
        </div>
      </div>
      {!hideActions ? (
        <div className="flex justify-end gap-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit">{customer ? 'Update' : 'Create'}</Button>
        </div>
      ) : null}
    </form>
  );
}

export default CustomerForm;



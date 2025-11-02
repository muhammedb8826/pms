"use client";

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import type { Supplier } from '@/features/supplier/types';
import { useCreateSupplier, useUpdateSupplier } from '@/features/supplier/hooks/useSuppliers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Max 200 characters'),
  contact: z.string().max(200, 'Max 200 characters').optional().or(z.literal('')),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().max(500, 'Max 500 characters').optional().or(z.literal('')),
});

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSuccess: () => void;
  onCancel: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}

export function SupplierForm({ supplier, onSuccess, onCancel, formId, hideActions, onErrorChange, onSubmittingChange }: SupplierFormProps) {
  const [name, setName] = useState(supplier?.name ?? '');
  const [contact, setContact] = useState(supplier?.contact ?? '');
  const [email, setEmail] = useState(supplier?.email ?? '');
  const [address, setAddress] = useState(supplier?.address ?? '');
  const [errors, setErrors] = useState<{ name?: string; contact?: string; email?: string; address?: string; form?: string }>({});

  useEffect(() => {
    setName(supplier?.name ?? '');
    setContact(supplier?.contact ?? '');
    setEmail(supplier?.email ?? '');
    setAddress(supplier?.address ?? '');
  }, [supplier]);

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);
    const parsed = schema.safeParse({ name, contact, email, address });
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
      const data = {
        name: parsed.data.name,
        contact: parsed.data.contact || undefined,
        email: parsed.data.email || undefined,
        address: parsed.data.address || undefined,
      };
      if (supplier) {
        await updateMutation.mutateAsync({ id: supplier.id, dto: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess();
      if (!supplier) {
        setName('');
        setContact('');
        setEmail('');
        setAddress('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setErrors((prev) => ({ ...prev, form: message }));
      onErrorChange?.(message);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <div className="text-red-600 text-sm">{errors.form}</div>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">Name *</label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} />
        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="contact" className="block text-sm font-medium">Contact</label>
        <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} aria-invalid={Boolean(errors.contact)} />
        {errors.contact && <p className="text-xs text-red-600">{errors.contact}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} />
        {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="address" className="block text-sm font-medium">Address</label>
        <textarea
          id="address"
          className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-invalid={Boolean(errors.address)}
        />
        {errors.address && <p className="text-xs text-red-600">{errors.address}</p>}
      </div>

      {hideActions ? null : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : supplier ? 'Update' : 'Create'}</Button>
        </div>
      )}
    </form>
  );
}


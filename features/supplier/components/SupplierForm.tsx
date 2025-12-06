"use client";

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import type { Supplier, CreateSupplierDto, UpdateSupplierDto, SupplierType } from '@/features/supplier/types';
import { useCreateSupplier, useUpdateSupplier } from '@/features/supplier/hooks/useSuppliers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const baseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact: z.union([z.string(), z.literal('')]).optional(),
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  address: z.union([z.string(), z.literal('')]).optional(),
  supplierType: z.enum(['LICENSED', 'WALK_IN']).optional(),
  licenseIssueDate: z
    .union([z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'), z.literal('')])
    .optional(),
  licenseExpiryDate: z
    .union([z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'), z.literal('')])
    .optional(),
  tinNumber: z.union([z.string(), z.literal('')]).optional(),
});

const createSchema = baseSchema.superRefine((data, ctx) => {
  const isLicensed = data.supplierType === 'LICENSED';
  if (isLicensed) {
    if (!data.licenseExpiryDate || data.licenseExpiryDate.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'License expiry date is required for licensed suppliers',
        path: ['licenseExpiryDate'],
      });
    }
    if (data.licenseIssueDate && data.licenseExpiryDate) {
      const issueDate = new Date(data.licenseIssueDate);
      const expiryDate = new Date(data.licenseExpiryDate);
      if (expiryDate <= issueDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'License expiry date must be after issue date',
          path: ['licenseExpiryDate'],
        });
      }
    }
  }
});

const updateSchema = baseSchema.superRefine((data, ctx) => {
  const isLicensed = data.supplierType === 'LICENSED';
  if (isLicensed) {
    if (!data.licenseExpiryDate || data.licenseExpiryDate.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'License expiry date is required for licensed suppliers',
        path: ['licenseExpiryDate'],
      });
    }
    if (data.licenseIssueDate && data.licenseExpiryDate) {
      const issueDate = new Date(data.licenseIssueDate);
      const expiryDate = new Date(data.licenseExpiryDate);
      if (expiryDate <= issueDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'License expiry date must be after issue date',
          path: ['licenseExpiryDate'],
        });
      }
    }
  }
});

export function SupplierForm({
  supplier,
  onSuccess,
  onCancel,
  formId,
  hideActions,
  onErrorChange,
  onSubmittingChange,
}: {
  supplier?: Supplier | null;
  onSuccess: () => void;
  onCancel?: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    contact: supplier?.contact ?? '',
    email: supplier?.email ?? '',
    address: supplier?.address ?? '',
    supplierType: (supplier?.supplierType ?? 'LICENSED') as SupplierType,
    licenseIssueDate: supplier?.licenseIssueDate ?? '',
    licenseExpiryDate: supplier?.licenseExpiryDate ?? '',
    tinNumber: supplier?.tinNumber ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  useEffect(() => {
    onSubmittingChange?.(createMutation.isPending || updateMutation.isPending);
  }, [createMutation.isPending, updateMutation.isPending, onSubmittingChange]);

  // Reset license fields when switching to WALK_IN
  useEffect(() => {
    if (form.supplierType === 'WALK_IN') {
      setForm((prev) => ({
        ...prev,
        licenseIssueDate: '',
        licenseExpiryDate: '',
        tinNumber: '',
      }));
    }
  }, [form.supplierType]);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);

    try {
      const schema = supplier ? updateSchema : createSchema;
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

      const buildDto = (data: typeof form): CreateSupplierDto | UpdateSupplierDto => {
        const dto: CreateSupplierDto | UpdateSupplierDto = {
          name: data.name.trim(),
        };

        if (data.contact?.trim()) dto.contact = data.contact.trim();
        if (data.email?.trim()) dto.email = data.email.trim();
        if (data.address?.trim()) dto.address = data.address.trim();
        if (data.supplierType) dto.supplierType = data.supplierType;

        if (data.supplierType === 'LICENSED') {
          if (data.licenseIssueDate?.trim()) dto.licenseIssueDate = data.licenseIssueDate.trim();
          if (data.licenseExpiryDate?.trim()) dto.licenseExpiryDate = data.licenseExpiryDate.trim();
          if (data.tinNumber?.trim()) dto.tinNumber = data.tinNumber.trim();
        }

        return dto;
      };

      const dto = buildDto(parsed.data as typeof form);

      if (supplier) {
        await updateMutation.mutateAsync({ id: supplier.id, dto: dto as UpdateSupplierDto });
        handleApiSuccess('Supplier updated successfully');
      } else {
        await createMutation.mutateAsync(dto as CreateSupplierDto);
        handleApiSuccess('Supplier created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        const firstError = err.errors[0]?.message || 'Validation failed';
        onErrorChange?.(firstError);
      } else {
        const msg = handleApiError(err, { defaultMessage: 'Failed to save supplier' });
        onErrorChange?.(msg);
      }
    }
  }

  const isLicensed = form.supplierType === 'LICENSED';

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Name *
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="contact" className="text-sm font-medium">
            Contact
          </Label>
          <Input
            id="contact"
            value={form.contact || ''}
            onChange={(e) => setField('contact', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={form.email || ''}
            onChange={(e) => setField('email', e.target.value)}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address" className="text-sm font-medium">
            Address
          </Label>
          <Input
            id="address"
            value={form.address || ''}
            onChange={(e) => setField('address', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="supplierType" className="text-sm font-medium">
            Supplier Type
          </Label>
          <Select
            value={form.supplierType}
            onValueChange={(value) => setField('supplierType', value as SupplierType)}
          >
            <SelectTrigger id="supplierType">
              <SelectValue placeholder="Select supplier type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LICENSED">Licensed</SelectItem>
              <SelectItem value="WALK_IN">Walk-in</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLicensed && (
          <>
            <div>
              <Label htmlFor="licenseIssueDate" className="text-sm font-medium">
                License Issue Date
              </Label>
              <Input
                id="licenseIssueDate"
                type="date"
                value={form.licenseIssueDate || ''}
                onChange={(e) => setField('licenseIssueDate', e.target.value)}
                className={errors.licenseIssueDate ? 'border-destructive' : ''}
              />
              {errors.licenseIssueDate && (
                <p className="mt-1 text-xs text-destructive">{errors.licenseIssueDate}</p>
              )}
            </div>

            <div>
              <Label htmlFor="licenseExpiryDate" className="text-sm font-medium">
                License Expiry Date {isLicensed && '*'}
              </Label>
              <Input
                id="licenseExpiryDate"
                type="date"
                value={form.licenseExpiryDate || ''}
                onChange={(e) => setField('licenseExpiryDate', e.target.value)}
                className={errors.licenseExpiryDate ? 'border-destructive' : ''}
              />
              {errors.licenseExpiryDate && (
                <p className="mt-1 text-xs text-destructive">{errors.licenseExpiryDate}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="tinNumber" className="text-sm font-medium">
                TIN Number
              </Label>
              <Input
                id="tinNumber"
                value={form.tinNumber || ''}
                onChange={(e) => setField('tinNumber', e.target.value)}
                placeholder="Tax Identification Number"
              />
            </div>
          </>
        )}
      </div>
      {!hideActions ? (
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">{supplier ? 'Update' : 'Create'}</Button>
        </div>
      ) : null}
    </form>
  );
}

export default SupplierForm;

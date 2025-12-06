"use client";

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerType } from '@/features/customer/types';
import { useCreateCustomer, useUpdateCustomer } from '@/features/customer/hooks/useCustomers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const baseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.union([z.string(), z.literal('')]).optional(),
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  address: z.union([z.string(), z.literal('')]).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  customerType: z.enum(['LICENSED', 'WALK_IN']).optional(),
  licenseIssueDate: z
    .union([z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'), z.literal('')])
    .optional(),
  licenseExpiryDate: z
    .union([z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'), z.literal('')])
    .optional(),
  tinNumber: z.union([z.string(), z.literal('')]).optional(),
});

const createSchema = baseSchema.superRefine((data, ctx) => {
  // For LICENSED customers, licenseExpiryDate is required
  if (data.customerType === 'LICENSED') {
    if (!data.licenseExpiryDate || data.licenseExpiryDate.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['licenseExpiryDate'],
        message: 'License expiry date is required for licensed customers',
      });
    }
  }

  // If both dates are provided, expiry must be after issue date
  if (
    data.licenseIssueDate &&
    data.licenseIssueDate.trim() !== '' &&
    data.licenseExpiryDate &&
    data.licenseExpiryDate.trim() !== ''
  ) {
    const issueDate = new Date(data.licenseIssueDate);
    const expiryDate = new Date(data.licenseExpiryDate);
    if (expiryDate <= issueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['licenseExpiryDate'],
        message: 'License expiry date must be after issue date',
      });
    }
  }
});

const updateSchema = baseSchema.superRefine((data, ctx) => {
  // If updating to LICENSED, licenseExpiryDate becomes required
  if (data.customerType === 'LICENSED') {
    if (!data.licenseExpiryDate || data.licenseExpiryDate.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['licenseExpiryDate'],
        message: 'License expiry date is required for licensed customers',
      });
    }
  }

  // If both dates are provided, expiry must be after issue date
  if (
    data.licenseIssueDate &&
    data.licenseIssueDate.trim() !== '' &&
    data.licenseExpiryDate &&
    data.licenseExpiryDate.trim() !== ''
  ) {
    const issueDate = new Date(data.licenseIssueDate);
    const expiryDate = new Date(data.licenseExpiryDate);
    if (expiryDate <= issueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['licenseExpiryDate'],
        message: 'License expiry date must be after issue date',
      });
    }
  }
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
    status: (customer?.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
    customerType: customer?.customerType ?? 'LICENSED',
    licenseIssueDate: customer?.licenseIssueDate ?? '',
    licenseExpiryDate: customer?.licenseExpiryDate ?? '',
    tinNumber: customer?.tinNumber ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  useEffect(() => {
    onSubmittingChange?.(createMutation.isPending || updateMutation.isPending);
  }, [createMutation.isPending, updateMutation.isPending, onSubmittingChange]);

  // Reset license fields when switching to WALK_IN
  useEffect(() => {
    if (form.customerType === 'WALK_IN') {
      setForm((prev) => ({
        ...prev,
        licenseIssueDate: '',
        licenseExpiryDate: '',
        tinNumber: '',
      }));
    }
  }, [form.customerType]);

  function setField<K extends keyof CreateCustomerDto>(key: K, value: CreateCustomerDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);

    const schema = customer ? updateSchema : createSchema;
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
      const buildDto = (data: z.infer<typeof schema>): CreateCustomerDto | UpdateCustomerDto => {
        const dto: CreateCustomerDto | UpdateCustomerDto = {
          name: data.name.trim(),
        };

        if (data.phone && data.phone.trim() !== '') dto.phone = data.phone.trim();
        if (data.email && data.email.trim() !== '') dto.email = data.email.trim();
        if (data.address && data.address.trim() !== '') dto.address = data.address.trim();
        if (data.status) dto.status = data.status;
        if (data.customerType) dto.customerType = data.customerType;

        // Only include license fields for LICENSED customers
        if (data.customerType === 'LICENSED') {
          // licenseExpiryDate is required for LICENSED customers (validated by schema)
          if (data.licenseExpiryDate && data.licenseExpiryDate.trim() !== '') {
            dto.licenseExpiryDate = data.licenseExpiryDate.trim();
          }
          if (data.licenseIssueDate && data.licenseIssueDate.trim() !== '') {
            dto.licenseIssueDate = data.licenseIssueDate.trim();
          }
          if (data.tinNumber && data.tinNumber.trim() !== '') {
            dto.tinNumber = data.tinNumber.trim();
          }
        }

        return dto;
      };

      const dto = buildDto(parsed.data);

      if (customer) {
        await updateMutation.mutateAsync({ id: customer.id, dto: dto as UpdateCustomerDto });
        handleApiSuccess('Customer updated successfully');
      } else {
        await createMutation.mutateAsync(dto as CreateCustomerDto);
        handleApiSuccess('Customer created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = handleApiError(err, { defaultMessage: 'Failed to save customer' });
      onErrorChange?.(msg);
    }
  }

  const isLicensed = form.customerType === 'LICENSED';

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
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone
          </Label>
          <Input
            id="phone"
            value={form.phone || ''}
            onChange={(e) => setField('phone', e.target.value)}
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
          <Label htmlFor="customerType" className="text-sm font-medium">
            Customer Type
          </Label>
          <Select
            value={form.customerType}
            onValueChange={(value) => setField('customerType', value as CustomerType)}
          >
            <SelectTrigger id="customerType">
              <SelectValue placeholder="Select customer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LICENSED">Licensed</SelectItem>
              <SelectItem value="WALK_IN">Walk-in</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status" className="text-sm font-medium">
            Status
          </Label>
          <Select
            value={form.status}
            onValueChange={(value) => setField('status', value as 'ACTIVE' | 'INACTIVE')}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
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
          <Button type="submit">{customer ? 'Update' : 'Create'}</Button>
        </div>
      ) : null}
    </form>
  );
}

export default CustomerForm;



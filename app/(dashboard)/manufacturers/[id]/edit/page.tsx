"use client";

import React, { useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter, useParams } from 'next/navigation';
import { useManufacturer, useUpdateManufacturer } from '@/features/manufacturer/hooks/useManufacturers';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

export default function EditManufacturerPage() {
  const router = useRouter();
  const params = useParams();
  const manufacturerId = params.id as string;
  const { data: manufacturer, isLoading, error } = useManufacturer(manufacturerId);
  const updateMutation = useUpdateManufacturer();
  const [formState, setFormState] = useState<{ name: string; contact?: string; address?: string }>({
    name: '',
    contact: '',
    address: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  React.useEffect(() => {
    if (manufacturer) {
      setFormState({
        name: manufacturer.name ?? '',
        contact: manufacturer.contact ?? '',
        address: manufacturer.address ?? '',
      });
    }
  }, [manufacturer]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="p-4">Loading manufacturer...</div>
      </div>
    );
  }

  if (error || !manufacturer) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="p-4 text-red-600">
          {error ? (error instanceof Error ? error.message : 'Failed to load manufacturer') : 'Manufacturer not found'}
        </div>
        <Button variant="outline" onClick={() => router.push('/manufacturers')}>Back to Manufacturers</Button>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      setFormError('Name is required');
      return;
    }
    setFormError(null);
    setFormSubmitting(true);

    try {
      await updateMutation.mutateAsync({
        id: manufacturerId,
        dto: {
          name: formState.name.trim(),
          contact: formState.contact,
          address: formState.address,
        },
      });
      handleApiSuccess('Manufacturer updated successfully');
      router.push('/manufacturers');
    } catch (err) {
      const message = handleApiError(err, { defaultMessage: 'Failed to update manufacturer' });
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/manufacturers">Manufacturers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Manufacturer</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-md border p-4">
        <h1 className="text-xl font-semibold mb-2">Edit Manufacturer</h1>
        <form id="manufacturer-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="text-red-600 text-sm">{formError}</div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name *</label>
            <Input
              id="name"
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              disabled={formSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact" className="text-sm font-medium">Contact</label>
            <Input
              id="contact"
              value={formState.contact ?? ''}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  contact: event.target.value,
                }))
              }
              disabled={formSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">Address</label>
            <Input
              id="address"
              value={formState.address ?? ''}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  address: event.target.value,
                }))
              }
              disabled={formSubmitting}
            />
          </div>
        </form>
        <DialogFooter>
          <div className="flex w-full items-center justify-between pt-2">
            {formError ? <span className="text-xs text-red-600">{formError}</span> : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/manufacturers')}>Cancel</Button>
              <Button type="submit" form="manufacturer-form" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : 'Update'}</Button>
            </div>
          </div>
        </DialogFooter>
      </div>
    </div>
  );
}


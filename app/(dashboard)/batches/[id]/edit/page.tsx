"use client";

import React, { useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BatchForm } from '@/features/batch/components/BatchForm';
import { useRouter, useParams } from 'next/navigation';
import { useBatch } from '@/features/batch/hooks/useBatches';

export default function EditBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.id as string;
  const { data: batch, isLoading, error } = useBatch(batchId);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="p-4">Loading batch...</div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="p-4 text-red-600">
          {error ? (error instanceof Error ? error.message : 'Failed to load batch') : 'Batch not found'}
        </div>
        <Button variant="outline" onClick={() => router.push('/batches')}>Back to Batches</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/batches">Batches</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Batch</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-md border p-4">
        <h1 className="text-xl font-semibold mb-2">Edit Batch</h1>
        <BatchForm
          batch={batch}
          onSuccess={() => router.push('/batches')}
          onCancel={() => router.push('/batches')}
          onErrorChange={setFormError}
          onSubmittingChange={setFormSubmitting}
          formId="batch-form"
          hideActions
        />
        <DialogFooter>
          <div className="flex w-full items-center justify-between pt-2">
            {formError ? <span className="text-xs text-red-600">{formError}</span> : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/batches')}>Cancel</Button>
              <Button type="submit" form="batch-form" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : 'Update'}</Button>
            </div>
          </div>
        </DialogFooter>
      </div>
    </div>
  );
}


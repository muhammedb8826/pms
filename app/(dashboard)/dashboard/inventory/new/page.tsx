"use client";

import React, { useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/ProductForm';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/inventory">Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Product</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-md border p-4">
        <h1 className="text-xl font-semibold mb-2">Create Product</h1>
        <ProductForm
          onSuccess={() => router.push('/dashboard/inventory')}
          onCancel={() => router.push('/dashboard/inventory')}
          onErrorChange={setFormError}
          onSubmittingChange={setFormSubmitting}
          formId="product-form"
          hideActions
        />
        <DialogFooter>
          <div className="flex w-full items-center justify-between pt-2">
            {formError ? <span className="text-xs text-red-600">{formError}</span> : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard/inventory')}>Cancel</Button>
              <Button type="submit" form="product-form" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : 'Create'}</Button>
            </div>
          </div>
        </DialogFooter>
      </div>
    </div>
  );
}



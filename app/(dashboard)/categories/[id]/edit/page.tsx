"use client";

import React, { useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CategoryForm } from '@/features/category/components/CategoryForm';
import { useRouter, useParams } from 'next/navigation';
import { useCategory } from '@/features/category/hooks/useCategories';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const { data: category, isLoading, error } = useCategory(categoryId);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="p-4">Loading category...</div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="p-4 text-red-600">
          {error ? (error instanceof Error ? error.message : 'Failed to load category') : 'Category not found'}
        </div>
        <Button variant="outline" onClick={() => router.push('/categories')}>Back to Categories</Button>
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
            <BreadcrumbLink href="/categories">Categories</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Category</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-md border p-4">
        <h1 className="text-xl font-semibold mb-2">Edit Category</h1>
        <CategoryForm
          category={category}
          onSuccess={() => router.push('/categories')}
          onCancel={() => router.push('/categories')}
          onErrorChange={setFormError}
          onSubmittingChange={setFormSubmitting}
          formId="category-form"
          hideActions
        />
        <DialogFooter>
          <div className="flex w-full items-center justify-between pt-2">
            {formError ? <span className="text-xs text-red-600">{formError}</span> : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/categories')}>Cancel</Button>
              <Button type="submit" form="category-form" disabled={formSubmitting}>{formSubmitting ? 'Saving…' : 'Update'}</Button>
            </div>
          </div>
        </DialogFooter>
      </div>
    </div>
  );
}


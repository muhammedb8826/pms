"use client";

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import type { Category } from '@/features/category/types';
import { useCreateCategory, useUpdateCategory } from '@/features/category/hooks/useCategories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  description: z.string().max(500, 'Max 500 characters').optional().or(z.literal('')),
});

interface CategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
  onCancel: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}

export function CategoryForm({ category, onSuccess, onCancel, formId, hideActions, onErrorChange, onSubmittingChange }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [errors, setErrors] = useState<{ name?: string; description?: string; form?: string }>({});

  useEffect(() => {
    setName(category?.name ?? '');
    setDescription(category?.description ?? '');
  }, [category]);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);
    const parsed = schema.safeParse({ name, description });
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
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, dto: { name, description: description || undefined } });
      } else {
        await createMutation.mutateAsync({ name, description: description || undefined });
      }
      onSuccess();
      setName('');
      setDescription('');
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
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
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

      {hideActions ? null : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : category ? 'Update' : 'Create'}</Button>
        </div>
      )}
    </form>
  );
}



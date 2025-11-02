"use client";

import {
  useGetCategoriesQuery,
  useGetAllCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/features/category/api/categoryApi';
import type { Category, PaginatedCategories } from '@/features/category/types';

export function useCategories(
  page = 1,
  limit = 10,
  options?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
) {
  const query = useGetCategoriesQuery({
    page,
    limit,
    search: options?.search,
    sortBy: options?.sortBy,
    sortOrder: options?.sortOrder,
  });

  // Handle different API response formats:
  // - Direct: { categories: [...], total: ... }
  // - Wrapped: { success: true, data: { categories: [...], total: ... } }
  type WrappedResponse = {
    success: boolean;
    data: PaginatedCategories;
  };
  
  const rawData = query.data as PaginatedCategories | WrappedResponse | undefined;
  let categoriesArray: Category[] = [];
  let totalCount = 0;

  if (rawData) {
    // Check if response is wrapped: { success: true, data: { ... } }
    if ('success' in rawData && rawData.success && rawData.data) {
      const innerData = rawData.data;
      categoriesArray = Array.isArray(innerData?.categories) ? innerData.categories : [];
      totalCount = innerData?.total ?? 0;
    } else if (!('success' in rawData) && 'categories' in rawData && Array.isArray(rawData.categories)) {
      // Direct format: { categories: [...], total: ... }
      categoriesArray = rawData.categories;
      totalCount = rawData.total ?? 0;
    } else if (Array.isArray(rawData)) {
      // Array directly
      categoriesArray = rawData;
    }
  }

  return {
    categories: categoriesArray,
    total: totalCount,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useCategory(id?: string) {
  const query = useGetCategoryQuery(id || '', { skip: !id });
  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as Category | WrappedResponse<Category> | undefined;
  const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as WrappedResponse<Category>).data : (raw as Category | undefined);
  return { ...query, data } as typeof query & { data: Category | undefined };
}

export function useAllCategories() {
  return useGetAllCategoriesQuery();
}

export function useCreateCategory() {
  const [createCategory, result] = useCreateCategoryMutation();
  return {
    mutateAsync: createCategory,
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateCategory() {
  const [updateCategory, result] = useUpdateCategoryMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: Parameters<typeof updateCategory>[0]['data'] }) =>
      updateCategory({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteCategory() {
  const [deleteCategory, result] = useDeleteCategoryMutation();
  return {
    mutateAsync: deleteCategory,
    isPending: result.isLoading,
    ...result,
  };
}


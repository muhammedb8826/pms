"use client";

import {
  useGetCategoriesQuery,
  useGetAllCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/features/category/api/categoryApi';

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

  return {
    categories: query.data?.categories ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useCategory(id?: string) {
  return useGetCategoryQuery(id || '', { skip: !id });
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


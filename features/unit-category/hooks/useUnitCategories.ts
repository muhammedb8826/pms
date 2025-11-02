"use client";

import {
  useGetUnitCategoriesQuery,
  useGetAllUnitCategoriesQuery,
  useGetUnitCategoryQuery,
  useCreateUnitCategoryMutation,
  useUpdateUnitCategoryMutation,
  useDeleteUnitCategoryMutation,
} from '@/features/unit-category/api/unitCategoryApi';

export function useUnitCategories(
  page = 1,
  limit = 10,
  options?: { q?: string }
) {
  const query = useGetUnitCategoriesQuery({
    page,
    limit,
    q: options?.q,
  });

  return {
    unitCategories: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useUnitCategory(id?: string) {
  return useGetUnitCategoryQuery(id || '', { skip: !id });
}

export function useAllUnitCategories() {
  return useGetAllUnitCategoriesQuery();
}

export function useCreateUnitCategory() {
  const [createUnitCategory, result] = useCreateUnitCategoryMutation();
  return {
    mutateAsync: createUnitCategory,
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateUnitCategory() {
  const [updateUnitCategory, result] = useUpdateUnitCategoryMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: Parameters<typeof updateUnitCategory>[0]['data'] }) =>
      updateUnitCategory({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteUnitCategory() {
  const [deleteUnitCategory, result] = useDeleteUnitCategoryMutation();
  return {
    mutateAsync: deleteUnitCategory,
    isPending: result.isLoading,
    ...result,
  };
}


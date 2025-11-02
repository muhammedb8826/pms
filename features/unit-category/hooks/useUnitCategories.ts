"use client";

import {
  useGetUnitCategoriesQuery,
  useGetAllUnitCategoriesQuery,
  useGetUnitCategoryQuery,
  useCreateUnitCategoryMutation,
  useUpdateUnitCategoryMutation,
  useDeleteUnitCategoryMutation,
} from '@/features/unit-category/api/unitCategoryApi';
import type { UnitCategory, PaginatedUnitCategories } from '@/features/unit-category/types';

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

  // Handle different API response formats:
  // - Direct: { data: [...], total: ... }
  // - Wrapped: { success: true, data: { data: [...], total: ... } }
  type WrappedResponse = {
    success: boolean;
    data: PaginatedUnitCategories;
  };
  
  const rawData = query.data as PaginatedUnitCategories | WrappedResponse | undefined;
  let unitCategoriesArray: UnitCategory[] = [];
  let totalCount = 0;

  if (rawData) {
    // Check if response is wrapped: { success: true, data: { ... } }
    if ('success' in rawData && rawData.success && rawData.data) {
      const innerData = rawData.data;
      unitCategoriesArray = Array.isArray(innerData?.data) ? innerData.data : [];
      totalCount = innerData?.total ?? 0;
    } else if (!('success' in rawData) && 'data' in rawData && Array.isArray(rawData.data)) {
      // Direct format: { data: [...], total: ... }
      unitCategoriesArray = rawData.data;
      totalCount = rawData.total ?? 0;
    } else if (Array.isArray(rawData)) {
      // Array directly
      unitCategoriesArray = rawData;
    }
  }

  return {
    unitCategories: unitCategoriesArray,
    total: totalCount,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useUnitCategory(id?: string) {
  const query = useGetUnitCategoryQuery(id || '', { skip: !id });
  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as UnitCategory | WrappedResponse<UnitCategory> | undefined;
  const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as WrappedResponse<UnitCategory>).data : (raw as UnitCategory | undefined);
  return { ...query, data } as typeof query & { data: UnitCategory | undefined };
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


"use client";

import {
  useGetUnitOfMeasuresQuery,
  useGetAllUnitOfMeasuresQuery,
  useCreateUnitOfMeasureMutation,
  useUpdateUnitOfMeasureMutation,
  useDeleteUnitOfMeasureMutation,
} from '@/features/uom/api/uomApi';
import type { UnitOfMeasure, PaginatedUnitOfMeasures } from '@/features/uom/types';

export function useUnitOfMeasures(page = 1, limit = 10, options?: { q?: string; unitCategoryId?: string }) {
  const query = useGetUnitOfMeasuresQuery({
    page,
    limit,
    q: options?.q,
    unitCategoryId: options?.unitCategoryId,
  });

  // Handle different API response formats:
  // - Direct: { data: [...], total: ... }
  // - Wrapped: { success: true, data: { data: [...], total: ... } }
  type WrappedResponse = {
    success: boolean;
    data: PaginatedUnitOfMeasures;
  };
  
  const rawData = query.data as PaginatedUnitOfMeasures | WrappedResponse | undefined;
  let unitOfMeasuresArray: UnitOfMeasure[] = [];
  let totalCount = 0;

  if (rawData) {
    // Check if response is wrapped: { success: true, data: { ... } }
    if ('success' in rawData && rawData.success && rawData.data) {
      const innerData = rawData.data;
      unitOfMeasuresArray = Array.isArray(innerData?.data) ? innerData.data : [];
      totalCount = innerData?.total ?? 0;
    } else if (!('success' in rawData) && 'data' in rawData && Array.isArray(rawData.data)) {
      // Direct format: { data: [...], total: ... }
      unitOfMeasuresArray = rawData.data;
      totalCount = rawData.total ?? 0;
    } else if (Array.isArray(rawData)) {
      // Array directly
      unitOfMeasuresArray = rawData;
    }
  }

  return {
    unitOfMeasures: unitOfMeasuresArray,
    total: totalCount,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useAllUnitOfMeasures(options?: { q?: string; unitCategoryId?: string }) {
  return useGetAllUnitOfMeasuresQuery(options || undefined);
}

export function useCreateUnitOfMeasure() {
  const [createUnitOfMeasure, result] = useCreateUnitOfMeasureMutation();
  return {
    mutateAsync: createUnitOfMeasure,
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateUnitOfMeasure() {
  const [updateUnitOfMeasure, result] = useUpdateUnitOfMeasureMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: Parameters<typeof updateUnitOfMeasure>[0]['data'] }) =>
      updateUnitOfMeasure({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteUnitOfMeasure() {
  const [deleteUnitOfMeasure, result] = useDeleteUnitOfMeasureMutation();
  return {
    mutateAsync: deleteUnitOfMeasure,
    isPending: result.isLoading,
    ...result,
  };
}


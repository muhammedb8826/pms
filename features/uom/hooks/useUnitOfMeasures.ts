"use client";

import {
  useGetUnitOfMeasuresQuery,
  useGetAllUnitOfMeasuresQuery,
  useCreateUnitOfMeasureMutation,
  useUpdateUnitOfMeasureMutation,
  useDeleteUnitOfMeasureMutation,
} from '@/features/uom/api/uomApi';

export function useUnitOfMeasures(page = 1, limit = 10, options?: { q?: string; unitCategoryId?: string }) {
  const query = useGetUnitOfMeasuresQuery({
    page,
    limit,
    q: options?.q,
    unitCategoryId: options?.unitCategoryId,
  });
  return {
    unitOfMeasures: query.data?.data ?? [],
    total: query.data?.total ?? 0,
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


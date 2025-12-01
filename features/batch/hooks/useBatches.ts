"use client";

import {
  useGetBatchesQuery,
  useGetBatchesByProductQuery,
  useGetAvailableBatchesForProductQuery,
  useGetBatchQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useDeleteBatchMutation,
} from '@/features/batch/api/batchApi';
import type { Batch, UpdateBatchDto } from '@/features/batch/types';

export function useBatches(options?: { productId?: string; supplierId?: string; expiredOnly?: boolean }) {
  const query = useGetBatchesQuery(options || undefined);
  return {
    batches: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useBatchesByProduct(productId?: string) {
  const query = useGetBatchesByProductQuery(productId || '', { skip: !productId });
  return {
    batches: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Get available batches for a product using FEFO (First Expired First Out)
 * Returns only batches that are ACTIVE, not recalled, not quarantined, quantity > 0, and not expired
 * Results are sorted by expiry date (earliest first)
 */
export function useAvailableBatchesForProduct(productId?: string, quantity?: number) {
  const query = useGetAvailableBatchesForProductQuery(
    { productId: productId || '', quantity },
    { skip: !productId }
  );
  return {
    batches: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useBatch(id?: string) {
  return useGetBatchQuery(id || '', { skip: !id });
}

export function useCreateBatch() {
  const [mutate, result] = useCreateBatchMutation();
  return { mutateAsync: mutate, isPending: result.isLoading, ...result };
}

export function useUpdateBatch() {
  const [mutate, result] = useUpdateBatchMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: UpdateBatchDto }) => mutate({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteBatch() {
  const [mutate, result] = useDeleteBatchMutation();
  return { mutateAsync: mutate, isPending: result.isLoading, ...result };
}



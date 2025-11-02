"use client";

import {
  useGetBatchesQuery,
  useGetBatchesByProductQuery,
  useGetBatchQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useDeleteBatchMutation,
} from '@/features/batch/api/batchApi';
import type { Batch, UpdateBatchDto } from '@/features/batch/types';

export function useBatches(options?: { productId?: string; supplierId?: string; expiredOnly?: boolean }) {
  const query = useGetBatchesQuery(options || undefined);
  type Wrapped<T> = { success?: boolean; data?: T };
  const raw = query.data as Batch[] | Wrapped<Batch[]> | undefined;
  const batches = Array.isArray(raw)
    ? raw
    : raw && 'data' in (raw as Wrapped<Batch[]>) && Array.isArray((raw as Wrapped<Batch[]>).data)
      ? ((raw as Wrapped<Batch[]>).data as Batch[])
      : ([] as Batch[]);
  return {
    batches,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useBatchesByProduct(productId?: string) {
  const query = useGetBatchesByProductQuery(productId || '', { skip: !productId });
  type Wrapped<T> = { success?: boolean; data?: T };
  const raw = query.data as Batch[] | Wrapped<Batch[]> | undefined;
  const batches = Array.isArray(raw)
    ? raw
    : raw && 'data' in (raw as Wrapped<Batch[]>) && Array.isArray((raw as Wrapped<Batch[]>).data)
      ? ((raw as Wrapped<Batch[]>).data as Batch[])
      : ([] as Batch[]);
  return { ...query, batches } as typeof query & { batches: Batch[] };
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



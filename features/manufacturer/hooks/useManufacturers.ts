"use client";

import {
  useGetManufacturersQuery,
  useGetAllManufacturersQuery,
  useCreateManufacturerMutation,
  useUpdateManufacturerMutation,
  useDeleteManufacturerMutation,
} from '@/features/manufacturer/api/manufacturerApi';

export function useManufacturers(page = 1, limit = 10, options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  const query = useGetManufacturersQuery({
    page,
    limit,
    search: options?.search,
    sortBy: options?.sortBy,
    sortOrder: options?.sortOrder,
  });
  return {
    manufacturers: query.data?.manufacturers ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useAllManufacturers(options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  return useGetAllManufacturersQuery(options || undefined);
}

export function useCreateManufacturer() {
  const [createManufacturer, result] = useCreateManufacturerMutation();
  return {
    mutateAsync: createManufacturer,
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateManufacturer() {
  const [updateManufacturer, result] = useUpdateManufacturerMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: Parameters<typeof updateManufacturer>[0]['data'] }) =>
      updateManufacturer({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteManufacturer() {
  const [deleteManufacturer, result] = useDeleteManufacturerMutation();
  return {
    mutateAsync: deleteManufacturer,
    isPending: result.isLoading,
    ...result,
  };
}


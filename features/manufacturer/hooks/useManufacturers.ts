"use client";

import {
  useGetManufacturersQuery,
  useGetAllManufacturersQuery,
  useCreateManufacturerMutation,
  useUpdateManufacturerMutation,
  useDeleteManufacturerMutation,
} from '@/features/manufacturer/api/manufacturerApi';
import type { Manufacturer, PaginatedManufacturers } from '@/features/manufacturer/types';

export function useManufacturers(page = 1, limit = 10, options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  const query = useGetManufacturersQuery({
    page,
    limit,
    search: options?.search,
    sortBy: options?.sortBy,
    sortOrder: options?.sortOrder,
  });

  // Handle different API response formats:
  // - Direct: { manufacturers: [...], total: ... }
  // - Wrapped: { success: true, data: { manufacturers: [...], total: ... } }
  type WrappedResponse = {
    success: boolean;
    data: PaginatedManufacturers;
  };
  
  const rawData = query.data as PaginatedManufacturers | WrappedResponse | undefined;
  let manufacturersArray: Manufacturer[] = [];
  let totalCount = 0;

  if (rawData) {
    // Check if response is wrapped: { success: true, data: { ... } }
    if ('success' in rawData && rawData.success && rawData.data) {
      const innerData = rawData.data;
      manufacturersArray = Array.isArray(innerData?.manufacturers) ? innerData.manufacturers : [];
      totalCount = innerData?.total ?? 0;
    } else if (!('success' in rawData) && 'manufacturers' in rawData && Array.isArray(rawData.manufacturers)) {
      // Direct format: { manufacturers: [...], total: ... }
      manufacturersArray = rawData.manufacturers;
      totalCount = rawData.total ?? 0;
    } else if (Array.isArray(rawData)) {
      // Array directly
      manufacturersArray = rawData;
    }
  }

  return {
    manufacturers: manufacturersArray,
    total: totalCount,
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


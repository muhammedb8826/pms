"use client";

import {
  useGetManufacturersQuery,
  useGetAllManufacturersQuery,
  useGetManufacturerQuery,
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

export function useManufacturer(id?: string) {
  const query = useGetManufacturerQuery(id || '', { skip: !id });
  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as Manufacturer | WrappedResponse<Manufacturer> | undefined;
  const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as WrappedResponse<Manufacturer>).data : (raw as Manufacturer | undefined);
  return { ...query, data } as typeof query & { data: Manufacturer | undefined };
}

function unwrapManufacturer(response: unknown): Manufacturer {
  if (!response || typeof response !== 'object') {
    throw new Error('Empty manufacturer response');
  }

  if ('id' in response && typeof (response as { id?: unknown }).id === 'string') {
    return response as Manufacturer;
  }

  if ('manufacturer' in response) {
    const manufacturer = (response as { manufacturer?: unknown }).manufacturer;
    if (manufacturer && typeof manufacturer === 'object' && 'id' in manufacturer) {
      return manufacturer as Manufacturer;
    }
  }

  if ('data' in response) {
    const data = (response as { data?: unknown }).data;
    if (data && typeof data === 'object') {
      if ('id' in data && typeof (data as { id?: unknown }).id === 'string') {
        return data as Manufacturer;
      }
      if ('data' in data) {
        const inner = (data as { data?: unknown }).data;
        if (inner && typeof inner === 'object' && 'id' in inner) {
          return inner as Manufacturer;
        }
      }
    }
  }

  throw new Error('Unable to unwrap manufacturer response');
}

export function useCreateManufacturer() {
  const [createManufacturer, result] = useCreateManufacturerMutation();
  return {
    mutateAsync: async (dto: Parameters<typeof createManufacturer>[0]) => {
      const response = await createManufacturer(dto).unwrap();
      return unwrapManufacturer(response);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateManufacturer() {
  const [updateManufacturer, result] = useUpdateManufacturerMutation();
  return {
    mutateAsync: async ({ id, dto }: { id: string; dto: Parameters<typeof updateManufacturer>[0]['data'] }) => {
      const response = await updateManufacturer({ id, data: dto }).unwrap();
      return unwrapManufacturer(response);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteManufacturer() {
  const [deleteManufacturer, result] = useDeleteManufacturerMutation();
  return {
    mutateAsync: async (id: Parameters<typeof deleteManufacturer>[0]) => {
      const response = await deleteManufacturer(id).unwrap();
      return response;
    },
    isPending: result.isLoading,
    ...result,
  };
}

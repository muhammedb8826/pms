"use client";

import {
  useGetSuppliersQuery,
  useGetAllSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '@/features/supplier/api/supplierApi';
import type { Supplier, PaginatedSuppliers } from '@/features/supplier/types';

export function useSuppliers(page = 1, limit = 10, options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  const query = useGetSuppliersQuery({
    page,
    limit,
    search: options?.search,
    sortBy: options?.sortBy,
    sortOrder: options?.sortOrder,
  });

  // Handle different API response formats:
  // - Direct: { suppliers: [...], total: ... }
  // - Wrapped: { success: true, data: { suppliers: [...], total: ... } }
  type WrappedResponse = {
    success: boolean;
    data: PaginatedSuppliers;
  };
  
  const rawData = query.data as PaginatedSuppliers | WrappedResponse | undefined;
  let suppliersArray: Supplier[] = [];
  let totalCount = 0;

  if (rawData) {
    // Check if response is wrapped: { success: true, data: { ... } }
    if ('success' in rawData && rawData.success && rawData.data) {
      const innerData = rawData.data;
      suppliersArray = Array.isArray(innerData?.suppliers) ? innerData.suppliers : [];
      totalCount = innerData?.total ?? 0;
    } else if (!('success' in rawData) && 'suppliers' in rawData && Array.isArray(rawData.suppliers)) {
      // Direct format: { suppliers: [...], total: ... }
      suppliersArray = rawData.suppliers;
      totalCount = rawData.total ?? 0;
    } else if (Array.isArray(rawData)) {
      // Array directly
      suppliersArray = rawData;
    }
  }

  return {
    suppliers: suppliersArray,
    total: totalCount,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useAllSuppliers(options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  return useGetAllSuppliersQuery(options || undefined);
}

export function useSupplier(id: string | undefined) {
  const query = useGetSupplierQuery(id!, { skip: !id });
  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as Supplier | WrappedResponse<Supplier> | undefined;
  const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as WrappedResponse<Supplier>).data : (raw as Supplier | undefined);
  return { ...query, data } as typeof query & { data: Supplier | undefined };
}

export function useCreateSupplier() {
  const [createSupplier, result] = useCreateSupplierMutation();
  return {
    mutateAsync: createSupplier,
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateSupplier() {
  const [updateSupplier, result] = useUpdateSupplierMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: Parameters<typeof updateSupplier>[0]['data'] }) =>
      updateSupplier({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteSupplier() {
  const [deleteSupplier, result] = useDeleteSupplierMutation();
  return {
    mutateAsync: deleteSupplier,
    isPending: result.isLoading,
    ...result,
  };
}


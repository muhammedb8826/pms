"use client";

import {
  useGetSuppliersQuery,
  useGetAllSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '@/features/supplier/api/supplierApi';

export function useSuppliers(page = 1, limit = 10, options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  const query = useGetSuppliersQuery({
    page,
    limit,
    search: options?.search,
    sortBy: options?.sortBy,
    sortOrder: options?.sortOrder,
  });
  return {
    suppliers: query.data?.suppliers ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useAllSuppliers(options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  return useGetAllSuppliersQuery(options || undefined);
}

export function useSupplier(id: string | undefined) {
  return useGetSupplierQuery(id!, { skip: !id });
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


"use client";

import {
  useGetSuppliersQuery,
  useGetAllSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '@/features/supplier/api/supplierApi';
import type { Supplier, PaginatedSuppliers, UpdateSupplierDto, CreateSupplierDto } from '@/features/supplier/types';
import { extractErrorMessage } from '@/lib/utils/api-error-handler';

export function useSuppliers(
  page = 1,
  limit = 10,
  options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
) {
  const query = useGetSuppliersQuery({ page, limit, search: options?.search, sortBy: options?.sortBy, sortOrder: options?.sortOrder });

  type WrappedResponse = { success?: boolean; data?: PaginatedSuppliers };
  const raw = query.data as PaginatedSuppliers | WrappedResponse | undefined;
  let suppliers: Supplier[] = [];
  let total = 0;
  if (raw) {
    if ('success' in raw && raw.success && raw.data) {
      suppliers = raw.data.suppliers ?? [];
      total = raw.data.total ?? 0;
    } else if ('suppliers' in raw) {
      suppliers = raw.suppliers ?? [];
      total = raw.total ?? 0;
    }
  }

  return {
    suppliers,
    total,
    loading: query.isLoading,
    error: query.error ? extractErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}

export function useAllSuppliers(options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  const query = useGetAllSuppliersQuery(options || undefined);
  type WR<T> = { success?: boolean; data?: T };
  const data = query.data as Supplier[] | WR<Supplier[]> | undefined;
  if (!data) return { ...query, suppliers: [] as Supplier[] };
  if (Array.isArray(data)) return { ...query, suppliers: data };
  if ('success' in data && data.success && Array.isArray(data.data)) return { ...query, suppliers: data.data };
  return { ...query, suppliers: [] as Supplier[] };
}

export function useSupplier(id?: string) {
  const query = useGetSupplierQuery(id || '', { skip: !id });
  type Wrapped<T> = { success?: boolean; data?: T };
  const raw = query.data as Supplier | Wrapped<Supplier> | undefined;
  const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as Wrapped<Supplier>).data : (raw as Supplier | undefined);
  return { ...query, data } as typeof query & { data: Supplier | undefined };
}

export function useCreateSupplier() {
  const [mutate, result] = useCreateSupplierMutation();
  return { mutateAsync: mutate, isPending: result.isLoading, ...result };
}

export function useUpdateSupplier() {
  const [mutate, result] = useUpdateSupplierMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: UpdateSupplierDto }) => mutate({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteSupplier() {
  const [mutate, result] = useDeleteSupplierMutation();
  return { mutateAsync: mutate, isPending: result.isLoading, ...result };
}

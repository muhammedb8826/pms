"use client";

import {
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
  useGetPurchaseItemsQuery,
  useCreatePurchaseItemMutation,
  useUpdatePurchaseItemMutation,
  useDeletePurchaseItemMutation,
} from '@/features/purchase/api/purchaseApi';
import type { Purchase, PaginatedPurchases } from '@/features/purchase/types';

export function usePurchases(page = 1, limit = 10, options?: { 
  search?: string; 
  supplierId?: string;
  status?: string;
  sortBy?: string; 
  sortOrder?: 'ASC' | 'DESC' 
}) {
  const query = useGetPurchasesQuery({
    page,
    limit,
    search: options?.search,
    supplierId: options?.supplierId,
    status: options?.status,
    sortBy: options?.sortBy,
    sortOrder: options?.sortOrder,
  });

  // Handle different API response formats:
  // - Direct: { purchases: [...], total: ... }
  // - Wrapped: { success: true, data: { purchases: [...], total: ... } }
  type WrappedResponse = {
    success: boolean;
    data: PaginatedPurchases;
  };
  
  const rawData = query.data as PaginatedPurchases | WrappedResponse | undefined;
  let purchasesArray: Purchase[] = [];
  let totalCount = 0;

  if (rawData) {
    // Check if response is wrapped: { success: true, data: { ... } }
    if ('success' in rawData && rawData.success && rawData.data) {
      const innerData = rawData.data;
      purchasesArray = Array.isArray(innerData?.purchases) ? innerData.purchases : [];
      totalCount = innerData?.total ?? 0;
    } else if (!('success' in rawData) && 'purchases' in rawData && Array.isArray(rawData.purchases)) {
      // Direct format: { purchases: [...], total: ... }
      purchasesArray = rawData.purchases;
      totalCount = rawData.total ?? 0;
    } else if (Array.isArray(rawData)) {
      // Array directly
      purchasesArray = rawData;
    }
  }

  return {
    purchases: purchasesArray,
    total: totalCount,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function usePurchase(id: string | undefined) {
  const query = useGetPurchaseQuery(id!, { skip: !id });

  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as Purchase | WrappedResponse<Purchase> | undefined;
  const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as WrappedResponse<Purchase>).data : (raw as Purchase | undefined);

  return { ...query, data } as typeof query & { data: Purchase | undefined };
}

export function useCreatePurchase() {
  const [createPurchase, result] = useCreatePurchaseMutation();
  return {
    mutateAsync: createPurchase,
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdatePurchase() {
  const [updatePurchase, result] = useUpdatePurchaseMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: Parameters<typeof updatePurchase>[0]['data'] }) =>
      updatePurchase({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeletePurchase() {
  const [deletePurchase, result] = useDeletePurchaseMutation();
  return {
    mutateAsync: deletePurchase,
    isPending: result.isLoading,
    ...result,
  };
}

export function usePurchaseItems(purchaseId?: string, productId?: string) {
  return useGetPurchaseItemsQuery(
    purchaseId || productId ? { purchaseId, productId } : undefined
  );
}

export function useCreatePurchaseItem() {
  const [createPurchaseItem, result] = useCreatePurchaseItemMutation();
  return {
    mutateAsync: createPurchaseItem,
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdatePurchaseItem() {
  const [updatePurchaseItem, result] = useUpdatePurchaseItemMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: Parameters<typeof updatePurchaseItem>[0]['data'] }) =>
      updatePurchaseItem({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeletePurchaseItem() {
  const [deletePurchaseItem, result] = useDeletePurchaseItemMutation();
  return {
    mutateAsync: deletePurchaseItem,
    isPending: result.isLoading,
    ...result,
  };
}


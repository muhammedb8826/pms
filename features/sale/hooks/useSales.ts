import {
  useGetSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useGetSaleItemsQuery,
  useGetSaleItemQuery,
  useCreateSaleItemMutation,
  useUpdateSaleItemMutation,
  useDeleteSaleItemMutation,
} from '@/features/sale/api/saleApi';
import type { PaginatedSales, Sale } from '@/features/sale/types';

export function useSales(params?: Parameters<typeof useGetSalesQuery>[0]) {
  const query = useGetSalesQuery(params);

  type WrappedResponse = { success: boolean; data: PaginatedSales };
  const rawData = query.data as PaginatedSales | WrappedResponse | undefined;
  let salesArray: Sale[] = [];
  let totalCount = 0;

  if (rawData) {
    if ('success' in rawData && rawData.success && rawData.data) {
      const inner = rawData.data;
      salesArray = Array.isArray((inner as any)?.sales) ? (inner as any).sales : [];
      totalCount = (inner as any)?.total ?? 0;
    } else if (!('success' in rawData) && 'sales' in rawData && Array.isArray((rawData as any).sales)) {
      salesArray = (rawData as any).sales;
      totalCount = (rawData as any).total ?? 0;
    } else if (Array.isArray(rawData)) {
      salesArray = rawData as unknown as Sale[];
    }
  }

  return {
    sales: salesArray,
    total: totalCount,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSale(id?: string) {
  const query = useGetSaleQuery(id || '', { skip: !id });
  type WrappedResponse = { success: boolean; data: Sale };
  const rawData = query.data as Sale | WrappedResponse | undefined;
  const data = rawData && 'success' in rawData && rawData.success && (rawData as any).data ? (rawData as any).data : rawData;
  return {
    data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export const useCreateSale = () => useCreateSaleMutation();
export const useUpdateSale = () => useUpdateSaleMutation();
export const useDeleteSale = () => useDeleteSaleMutation();

export const useSaleItems = (params?: Parameters<typeof useGetSaleItemsQuery>[0]) => {
  const query = useGetSaleItemsQuery(params);
  let items: unknown[] = [];
  const data = query.data as unknown;
  if (Array.isArray(data)) items = data;
  if (data && typeof data === 'object' && 'success' in data && (data as any).success && Array.isArray((data as any).data)) {
    items = (data as any).data;
  }
  return { items, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
};

export const useSaleItem = (id?: string) => {
  const query = useGetSaleItemQuery(id || '', { skip: !id });
  const raw = query.data as any;
  const data = raw && 'success' in raw && raw.success && raw.data ? raw.data : raw;
  return { data, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
};

export const useCreateSaleItem = () => useCreateSaleItemMutation();
export const useUpdateSaleItem = () => useUpdateSaleItemMutation();
export const useDeleteSaleItem = () => useDeleteSaleItemMutation();



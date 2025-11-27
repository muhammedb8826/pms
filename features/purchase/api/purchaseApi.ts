import { baseApi } from '@/features/common/api/baseApi';
import type {
  CreatePurchaseDto,
  Purchase,
  PaginatedPurchases,
  UpdatePurchaseDto,
  PurchaseItem,
  CreatePurchaseItemDto,
  UpdatePurchaseItemDto,
} from '@/features/purchase/types';

function unwrapResponse<T>(response: { data?: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: T }).data;
    if (data !== undefined) {
      return data;
    }
  }
  return response as T;
}

export const purchaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchases: builder.query<
      PaginatedPurchases,
      {
        page?: number;
        limit?: number;
        search?: string;
        supplierId?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      }
    >({
      query: (params = {}) => {
        const { page = 1, limit = 10, search, supplierId, status, sortBy, sortOrder } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (search) query.set('search', search);
        if (supplierId) query.set('supplierId', supplierId);
        if (status) query.set('status', status);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/purchases?${query.toString()}`;
      },
      transformResponse: unwrapResponse<PaginatedPurchases>,
      providesTags: ['Purchases'],
    }),
    getPurchase: builder.query<Purchase, string>({
      query: (id) => `/purchases/${id}`,
      transformResponse: unwrapResponse<Purchase>,
      providesTags: (result, error, id) => [{ type: 'Purchase', id }],
    }),
    createPurchase: builder.mutation<Purchase, CreatePurchaseDto>({
      query: (data) => ({
        url: '/purchases',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Purchases'],
    }),
    updatePurchase: builder.mutation<
      Purchase,
      { id: string; data: UpdatePurchaseDto }
    >({
      query: ({ id, data }) => ({
        url: `/purchases/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id, data }) => {
        const tags: (('Purchases' | 'Products') | { type: 'Purchase'; id: string })[] = [
          { type: 'Purchase', id },
          'Purchases',
        ];
        // When status is updated (especially to COMPLETED), refresh products to reflect new quantities
        if (data?.status) {
          tags.push('Products');
        }
        return tags;
      },
    }),
    deletePurchase: builder.mutation<void, string>({
      query: (id) => ({
        url: `/purchases/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Purchases'],
    }),
    // Purchase Items endpoints
    getPurchaseItems: builder.query<
      PurchaseItem[],
      {
        purchaseId?: string;
        productId?: string;
      } | void
    >({
      query: (params) => {
        if (!params) return '/purchase-items';
        const { purchaseId, productId } = params;
        const query = new URLSearchParams();
        if (purchaseId) query.set('purchaseId', purchaseId);
        if (productId) query.set('productId', productId);
        const queryString = query.toString();
        return `/purchase-items${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['PurchaseItems'],
    }),
    getPurchaseItem: builder.query<PurchaseItem, string>({
      query: (id) => `/purchase-items/${id}`,
      providesTags: (result, error, id) => [{ type: 'PurchaseItem', id }],
    }),
    createPurchaseItem: builder.mutation<
      PurchaseItem,
      { purchaseId: string; data: CreatePurchaseItemDto }
    >({
      query: ({ purchaseId, data }) => ({
        url: `/purchase-items/purchase/${purchaseId}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { purchaseId }) => [
        { type: 'Purchase', id: purchaseId },
        'Purchases',
        'PurchaseItems',
      ],
    }),
    updatePurchaseItem: builder.mutation<
      PurchaseItem,
      { id: string; data: UpdatePurchaseItemDto }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-items/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => {
        // We need to invalidate the parent purchase, but we don't have it here
        // The API should handle this, but we'll invalidate both
        return [
          { type: 'PurchaseItem', id },
          'Purchases',
          'PurchaseItems',
        ];
      },
    }),
    deletePurchaseItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/purchase-items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Purchases', 'PurchaseItems'],
    }),
  }),
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
  useGetPurchaseItemsQuery,
  useGetPurchaseItemQuery,
  useCreatePurchaseItemMutation,
  useUpdatePurchaseItemMutation,
  useDeletePurchaseItemMutation,
} = purchaseApi;


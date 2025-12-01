import { baseApi } from '@/features/common/api/baseApi';
import type { Batch, CreateBatchDto, UpdateBatchDto } from '@/features/batch/types';

function unwrapResponse<T>(response: { data?: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: T }).data;
    if (data !== undefined) {
      return data;
    }
  }
  return response as T;
}

export const batchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBatches: builder.query<
      Batch[],
      { productId?: string; supplierId?: string; expiredOnly?: boolean } | void
    >({
      query: (params) => {
        if (!params) return '/batches';
        const query = new URLSearchParams();
        if (params.productId) query.set('productId', params.productId);
        if (params.supplierId) query.set('supplierId', params.supplierId);
        if (typeof params.expiredOnly === 'boolean') query.set('expiredOnly', String(params.expiredOnly));
        const qs = query.toString();
        return `/batches${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<Batch[]>,
      providesTags: ['Batches'],
    }),
    getBatchesByProduct: builder.query<Batch[], string>({
      query: (productId) => `/batches/product/${productId}`,
      transformResponse: unwrapResponse<Batch[]>,
      providesTags: ['Batches'],
    }),
    getAvailableBatchesForProduct: builder.query<
      Batch[],
      { productId: string; quantity?: number }
    >({
      query: ({ productId, quantity }) => {
        const query = new URLSearchParams();
        if (quantity !== undefined) query.set('quantity', String(quantity));
        const qs = query.toString();
        return `/batches/product/${productId}/available${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<Batch[]>,
      providesTags: ['Batches'],
    }),
    getBatch: builder.query<Batch, string>({
      query: (id) => `/batches/${id}`,
      transformResponse: unwrapResponse<Batch>,
      providesTags: (result, error, id) => [{ type: 'Batch', id }],
    }),
    createBatch: builder.mutation<Batch, CreateBatchDto>({
      query: (data) => ({ url: '/batches', method: 'POST', body: data }),
      transformResponse: unwrapResponse<Batch>,
      invalidatesTags: ['Batches', 'Products'],
    }),
    updateBatch: builder.mutation<Batch, { id: string; data: UpdateBatchDto }>({
      query: ({ id, data }) => ({ url: `/batches/${id}`, method: 'PATCH', body: data }),
      transformResponse: unwrapResponse<Batch>,
      invalidatesTags: (result, error, { id }) => [{ type: 'Batch', id }, 'Batches', 'Products'],
    }),
    deleteBatch: builder.mutation<void, string>({
      query: (id) => ({ url: `/batches/${id}`, method: 'DELETE' }),
      transformResponse: unwrapResponse<void>,
      invalidatesTags: ['Batches', 'Products'],
    }),
  }),
});

export const {
  useGetBatchesQuery,
  useGetBatchesByProductQuery,
  useGetAvailableBatchesForProductQuery,
  useGetBatchQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useDeleteBatchMutation,
} = batchApi;



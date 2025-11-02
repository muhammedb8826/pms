import { baseApi } from '@/features/common/api/baseApi';
import type { Batch, CreateBatchDto, UpdateBatchDto } from '@/features/batch/types';

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
      providesTags: ['Batches'],
    }),
    getBatchesByProduct: builder.query<Batch[], string>({
      query: (productId) => `/batches/product/${productId}`,
      providesTags: ['Batches'],
    }),
    getBatch: builder.query<Batch, string>({
      query: (id) => `/batches/${id}`,
      providesTags: (result, error, id) => [{ type: 'Batch', id }],
    }),
    createBatch: builder.mutation<Batch, CreateBatchDto>({
      query: (data) => ({ url: '/batches', method: 'POST', body: data }),
      invalidatesTags: ['Batches', 'Products'],
    }),
    updateBatch: builder.mutation<Batch, { id: string; data: UpdateBatchDto }>({
      query: ({ id, data }) => ({ url: `/batches/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Batch', id }, 'Batches', 'Products'],
    }),
    deleteBatch: builder.mutation<void, string>({
      query: (id) => ({ url: `/batches/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Batches', 'Products'],
    }),
  }),
});

export const {
  useGetBatchesQuery,
  useGetBatchesByProductQuery,
  useGetBatchQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useDeleteBatchMutation,
} = batchApi;



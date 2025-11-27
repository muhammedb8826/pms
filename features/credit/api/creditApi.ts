import { baseApi } from '@/features/common/api/baseApi';
import type {
  Credit,
  CreateCreditDto,
  UpdateCreditDto,
  RecordPaymentDto,
  PaginatedCredits,
  CreditSummary,
  CreditFilters,
} from '@/features/credit/types';

function unwrapResponse<T>(response: { data?: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: T }).data;
    if (data !== undefined) {
      return data;
    }
  }
  return response as T;
}

export const creditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCredits: builder.query<PaginatedCredits, CreditFilters | undefined>({
      query: (params = {}) => {
        const {
          page = 1,
          limit = 10,
          type,
          status,
          supplierId,
          customerId,
          purchaseId,
          saleId,
          dueDateFrom,
          dueDateTo,
          search,
          sortBy = 'createdAt',
          sortOrder = 'DESC',
        } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (type) query.set('type', type);
        if (status) query.set('status', status);
        if (supplierId) query.set('supplierId', supplierId);
        if (customerId) query.set('customerId', customerId);
        if (purchaseId) query.set('purchaseId', purchaseId);
        if (saleId) query.set('saleId', saleId);
        if (dueDateFrom) query.set('dueDateFrom', dueDateFrom);
        if (dueDateTo) query.set('dueDateTo', dueDateTo);
        if (search) query.set('search', search);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/credits?${query.toString()}`;
      },
      transformResponse: unwrapResponse<PaginatedCredits>,
      providesTags: ['Credits'],
    }),
    getCreditSummary: builder.query<
      CreditSummary,
      { type?: 'PAYABLE' | 'RECEIVABLE' } | void
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.type) query.set('type', params.type);
        const queryString = query.toString();
        return `/credits/summary${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: unwrapResponse<CreditSummary>,
      providesTags: ['Credits'],
    }),
    getCredit: builder.query<Credit, string>({
      query: (id) => `/credits/${id}`,
      transformResponse: unwrapResponse<Credit>,
      providesTags: (result, error, id) => [{ type: 'Credit', id }],
    }),
    createCredit: builder.mutation<Credit, CreateCreditDto>({
      query: (data) => ({
        url: '/credits',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, data) => {
        const tags = ['Credits'] as const;
        // If credit is linked to a purchase, invalidate purchase cache
        if (data.purchaseId) {
          return [
            ...tags,
            'Purchases',
            { type: 'Purchase' as const, id: data.purchaseId },
          ];
        }
        // If credit is linked to a sale, invalidate sale cache
        if (data.saleId) {
          return [
            ...tags,
            'Sales',
            { type: 'Sale' as const, id: data.saleId },
          ];
        }
        return tags;
      },
    }),
    updateCredit: builder.mutation<Credit, { id: string; data: UpdateCreditDto }>({
      query: ({ id, data }) => ({
        url: `/credits/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => {
        const baseTags = [
          { type: 'Credit' as const, id },
          'Credits',
        ] as const;
        // If result contains purchase or sale info, invalidate those caches
        if (result?.purchase?.id) {
          return [
            ...baseTags,
            'Purchases',
            { type: 'Purchase' as const, id: result.purchase.id },
          ];
        }
        if (result?.sale?.id) {
          return [
            ...baseTags,
            'Sales',
            { type: 'Sale' as const, id: result.sale.id },
          ];
        }
        return baseTags;
      },
    }),
    recordPayment: builder.mutation<Credit, { id: string; data: RecordPaymentDto }>({
      query: ({ id, data }) => ({
        url: `/credits/${id}/pay`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => {
        const baseTags = [
          { type: 'Credit' as const, id },
          'Credits',
          'Payments', // Also invalidate payment history
        ] as const;
        // If result contains purchase or sale info, invalidate those caches
        if (result?.purchase?.id) {
          return [
            ...baseTags,
            'Purchases',
            { type: 'Purchase' as const, id: result.purchase.id },
          ];
        }
        if (result?.sale?.id) {
          return [
            ...baseTags,
            'Sales',
            { type: 'Sale' as const, id: result.sale.id },
          ];
        }
        return baseTags;
      },
    }),
    deleteCredit: builder.mutation<void, string>({
      query: (id) => ({
        url: `/credits/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Credits'],
    }),
  }),
});

export const {
  useGetCreditsQuery,
  useGetCreditSummaryQuery,
  useGetCreditQuery,
  useCreateCreditMutation,
  useUpdateCreditMutation,
  useRecordPaymentMutation,
  useDeleteCreditMutation,
} = creditApi;


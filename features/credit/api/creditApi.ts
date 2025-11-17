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
      providesTags: ['Credits'],
    }),
    getCredit: builder.query<Credit, string>({
      query: (id) => `/credits/${id}`,
      providesTags: (result, error, id) => [{ type: 'Credit', id }],
    }),
    createCredit: builder.mutation<Credit, CreateCreditDto>({
      query: (data) => ({
        url: '/credits',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Credits'],
    }),
    updateCredit: builder.mutation<Credit, { id: string; data: UpdateCreditDto }>({
      query: ({ id, data }) => ({
        url: `/credits/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Credit', id },
        'Credits',
      ],
    }),
    recordPayment: builder.mutation<Credit, { id: string; data: RecordPaymentDto }>({
      query: ({ id, data }) => ({
        url: `/credits/${id}/pay`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Credit', id },
        'Credits',
      ],
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


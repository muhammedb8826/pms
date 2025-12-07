import { baseApi } from '@/features/common/api/baseApi';
import type {
  Payment,
  PaginatedPayments,
  PaymentStatistics,
  PaymentFilters,
} from '@/features/payment/types';

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<PaginatedPayments, PaymentFilters>({
      query: (params = {}) => {
        const {
          page = 1,
          limit = 10,
          startDate,
          endDate,
          purchaseId,
          saleId,
          creditId,
          sortBy = 'createdAt',
          sortOrder = 'DESC',
        } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (startDate) query.set('startDate', startDate);
        if (endDate) query.set('endDate', endDate);
        if (purchaseId) query.set('purchaseId', purchaseId);
        if (saleId) query.set('saleId', saleId);
        if (creditId) query.set('creditId', creditId);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/payments?${query.toString()}`;
      },
      providesTags: ['Payments'],
    }),
    getPayment: builder.query<Payment, string>({
      query: (id) => `/payments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Payment', id }],
    }),
    getPaymentStatistics: builder.query<
      PaymentStatistics,
      { startDate?: string; endDate?: string }
    >({
      query: (params = {}) => {
        const { startDate, endDate } = params;
        const query = new URLSearchParams();
        if (startDate) query.set('startDate', startDate);
        if (endDate) query.set('endDate', endDate);
        const queryString = query.toString();
        return `/payments/statistics${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['PaymentStatistics'],
    }),
    deletePayment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/payments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Payment' as const, id },
        'Payments',
        'PaymentStatistics',
        // Note: We can't know which related entities are affected without fetching the payment first
        // But we'll invalidate all related caches to be safe
        'Purchases',
        'Sales',
        'Credits',
      ],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useGetPaymentStatisticsQuery,
  useDeletePaymentMutation,
} = paymentApi;


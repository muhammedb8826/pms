import { baseApi } from '@/features/common/api/baseApi';
import type {
  PaymentMethod,
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from '@/features/payment-method/types';

export const paymentMethodApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentMethods: builder.query<
      PaymentMethod[],
      { includeInactive?: boolean }
    >({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.includeInactive) {
          query.set('includeInactive', 'true');
        }
        const queryString = query.toString();
        return `/payment-methods${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['PaymentMethods'],
    }),
    getPaymentMethod: builder.query<PaymentMethod, string>({
      query: (id) => `/payment-methods/${id}`,
      providesTags: (result, error, id) => [{ type: 'PaymentMethod', id }],
    }),
    createPaymentMethod: builder.mutation<PaymentMethod, CreatePaymentMethodDto>({
      query: (data) => ({
        url: '/payment-methods',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PaymentMethods'],
    }),
    updatePaymentMethod: builder.mutation<
      PaymentMethod,
      { id: string; data: UpdatePaymentMethodDto }
    >({
      query: ({ id, data }) => ({
        url: `/payment-methods/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PaymentMethod', id },
        'PaymentMethods',
      ],
    }),
    deletePaymentMethod: builder.mutation<void, string>({
      query: (id) => ({
        url: `/payment-methods/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaymentMethods'],
    }),
  }),
});

export const {
  useGetPaymentMethodsQuery,
  useGetPaymentMethodQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
} = paymentMethodApi;


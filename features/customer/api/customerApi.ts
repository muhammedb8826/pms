import { baseApi } from '@/features/common/api/baseApi';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, PaginatedCustomers } from '@/features/customer/types';

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<
      PaginatedCustomers,
      {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      }
    >({
      query: (params = {}) => {
        const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (search) query.set('search', search);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/customers?${query.toString()}`;
      },
      providesTags: ['Customers'],
    }),
    getAllCustomers: builder.query<
      Customer[],
      { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' } | void
    >({
      query: (params) => {
        if (!params) return '/customers/all';
        const query = new URLSearchParams();
        if (params.search) query.set('search', params.search);
        if (params.sortBy) query.set('sortBy', params.sortBy);
        if (params.sortOrder) query.set('sortOrder', params.sortOrder);
        const qs = query.toString();
        return `/customers/all${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Customers'],
    }),
    getCustomer: builder.query<Customer, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation<Customer, CreateCustomerDto>({
      query: (data) => ({ url: '/customers', method: 'POST', body: data }),
      invalidatesTags: ['Customers'],
    }),
    updateCustomer: builder.mutation<Customer, { id: string; data: UpdateCustomerDto }>({
      query: ({ id, data }) => ({ url: `/customers/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customer', id },
        'Customers',
      ],
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customers'],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetAllCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;



import { baseApi } from '@/features/common/api/baseApi';
import type { Supplier, CreateSupplierDto, UpdateSupplierDto, PaginatedSuppliers } from '@/features/supplier/types';

export const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<
      PaginatedSuppliers,
      {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      }
    >({
      query: (params = {}) => {
        const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'ASC' } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (search) query.set('search', search);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/suppliers?${query.toString()}`;
      },
      providesTags: ['Suppliers'],
    }),
    getAllSuppliers: builder.query<
      Supplier[],
      { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' } | void
    >({
      query: (params) => {
        if (!params) return '/suppliers/all';
        const query = new URLSearchParams();
        if (params.search) query.set('search', params.search);
        if (params.sortBy) query.set('sortBy', params.sortBy);
        if (params.sortOrder) query.set('sortOrder', params.sortOrder);
        const qs = query.toString();
        return `/suppliers/all${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Suppliers'],
    }),
    getSupplier: builder.query<Supplier, string>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Supplier', id }],
    }),
    createSupplier: builder.mutation<Supplier, CreateSupplierDto>({
      query: (data) => ({ url: '/suppliers', method: 'POST', body: data }),
      invalidatesTags: ['Suppliers'],
    }),
    updateSupplier: builder.mutation<Supplier, { id: string; data: UpdateSupplierDto }>({
      query: ({ id, data }) => ({ url: `/suppliers/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Supplier', id },
        'Suppliers',
      ],
    }),
    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Suppliers'],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetAllSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApi;

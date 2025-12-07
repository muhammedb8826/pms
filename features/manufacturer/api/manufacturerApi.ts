import { baseApi } from '@/features/common/api/baseApi';
import type {
  CreateManufacturerDto,
  Manufacturer,
  PaginatedManufacturers,
  UpdateManufacturerDto,
} from '@/features/manufacturer/types';

export const manufacturerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getManufacturers: builder.query<
      PaginatedManufacturers,
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
        return `/manufacturers?${query.toString()}`;
      },
      providesTags: ['Manufacturers'],
    }),
    getAllManufacturers: builder.query<
      Manufacturer[],
      {
        search?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      } | void
    >({
      query: (params) => {
        if (!params) return '/manufacturers/all';
        const { search, sortBy, sortOrder } = params || {};
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        const queryString = query.toString();
        return `/manufacturers/all${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Manufacturers'],
    }),
    getManufacturer: builder.query<Manufacturer, string>({
      query: (id) => `/manufacturers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Manufacturer', id }],
    }),
    createManufacturer: builder.mutation<Manufacturer, CreateManufacturerDto>({
      query: (data) => ({
        url: '/manufacturers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Manufacturers'],
    }),
    updateManufacturer: builder.mutation<
      Manufacturer,
      { id: string; data: UpdateManufacturerDto }
    >({
      query: ({ id, data }) => ({
        url: `/manufacturers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Manufacturer', id },
        'Manufacturers',
      ],
    }),
    deleteManufacturer: builder.mutation<Manufacturer, string>({
      query: (id) => ({
        url: `/manufacturers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Manufacturers'],
    }),
  }),
});

export const {
  useGetManufacturersQuery,
  useGetAllManufacturersQuery,
  useGetManufacturerQuery,
  useCreateManufacturerMutation,
  useUpdateManufacturerMutation,
  useDeleteManufacturerMutation,
} = manufacturerApi;


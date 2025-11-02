import { baseApi } from '@/features/common/api/baseApi';
import type {
  CreateUnitOfMeasureDto,
  PaginatedUnitOfMeasures,
  UnitOfMeasure,
  UpdateUnitOfMeasureDto,
} from '@/features/uom/types';

export const uomApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnitOfMeasures: builder.query<
      PaginatedUnitOfMeasures,
      {
        page?: number;
        limit?: number;
        q?: string;
        unitCategoryId?: string;
      }
    >({
      query: (params = {}) => {
        const { page = 1, limit = 20, q, unitCategoryId } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (q) query.set('q', q);
        if (unitCategoryId) query.set('unitCategoryId', unitCategoryId);
        return `/uoms?${query.toString()}`;
      },
      providesTags: ['UnitOfMeasures'],
    }),
    getAllUnitOfMeasures: builder.query<
      UnitOfMeasure[],
      {
        q?: string;
        unitCategoryId?: string;
      } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.set('page', '1');
        queryParams.set('limit', '1000');
        if (params?.q) queryParams.set('q', params.q);
        if (params?.unitCategoryId) queryParams.set('unitCategoryId', params.unitCategoryId);
        const queryString = queryParams.toString();
        return `/uoms?${queryString}`;
      },
      transformResponse: (response: PaginatedUnitOfMeasures) => response.data,
      providesTags: ['UnitOfMeasures'],
    }),
    getUnitOfMeasure: builder.query<UnitOfMeasure, string>({
      query: (id) => `/uoms/${id}`,
      providesTags: (result, error, id) => [{ type: 'UnitOfMeasure', id }],
    }),
    createUnitOfMeasure: builder.mutation<UnitOfMeasure, CreateUnitOfMeasureDto>({
      query: (data) => ({
        url: '/uoms',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UnitOfMeasures'],
    }),
    updateUnitOfMeasure: builder.mutation<
      UnitOfMeasure,
      { id: string; data: UpdateUnitOfMeasureDto }
    >({
      query: ({ id, data }) => ({
        url: `/uoms/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'UnitOfMeasure', id },
        'UnitOfMeasures',
      ],
    }),
    deleteUnitOfMeasure: builder.mutation<void, string>({
      query: (id) => ({
        url: `/uoms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UnitOfMeasures'],
    }),
  }),
});

export const {
  useGetUnitOfMeasuresQuery,
  useGetAllUnitOfMeasuresQuery,
  useGetUnitOfMeasureQuery,
  useCreateUnitOfMeasureMutation,
  useUpdateUnitOfMeasureMutation,
  useDeleteUnitOfMeasureMutation,
} = uomApi;


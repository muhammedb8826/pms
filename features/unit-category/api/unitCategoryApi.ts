import { baseApi } from '@/features/common/api/baseApi';
import type {
  UnitCategory,
  CreateUnitCategoryDto,
  PaginatedUnitCategories,
  UpdateUnitCategoryDto,
} from '@/features/unit-category/types';

export const unitCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnitCategories: builder.query<
      PaginatedUnitCategories,
      {
        page?: number;
        limit?: number;
        q?: string;
      }
    >({
      query: (params = {}) => {
        const { page = 1, limit = 20, q } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (q) query.set('q', q);
        return `/unit-categories?${query.toString()}`;
      },
      providesTags: ['UnitCategories'],
    }),
    getAllUnitCategories: builder.query<UnitCategory[], void>({
      query: () => {
        // Use paginated endpoint with high limit to get all categories
        return '/unit-categories?page=1&limit=1000';
      },
      transformResponse: (response: PaginatedUnitCategories) => response.data,
      providesTags: ['UnitCategories'],
    }),
    getUnitCategory: builder.query<UnitCategory, string>({
      query: (id) => `/unit-categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'UnitCategory', id }],
    }),
    createUnitCategory: builder.mutation<UnitCategory, CreateUnitCategoryDto>({
      query: (data) => ({
        url: '/unit-categories',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UnitCategories'],
    }),
    updateUnitCategory: builder.mutation<UnitCategory, { id: string; data: UpdateUnitCategoryDto }>({
      query: ({ id, data }) => ({
        url: `/unit-categories/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'UnitCategory', id },
        'UnitCategories',
      ],
    }),
    deleteUnitCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/unit-categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UnitCategories'],
    }),
  }),
});

export const {
  useGetUnitCategoriesQuery,
  useGetAllUnitCategoriesQuery,
  useGetUnitCategoryQuery,
  useCreateUnitCategoryMutation,
  useUpdateUnitCategoryMutation,
  useDeleteUnitCategoryMutation,
} = unitCategoryApi;


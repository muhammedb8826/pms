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
      transformResponse: (
        response: UnitCategory[] | PaginatedUnitCategories | { success: true; data: PaginatedUnitCategories }
      ): UnitCategory[] => {
        // Narrow: raw array
        if (Array.isArray(response)) return response;

        // Type guards without using `any`
        const isWrapped = (
          r: unknown
        ): r is { success: true; data: PaginatedUnitCategories } => {
          if (typeof r !== 'object' || r === null) return false;
          const obj = r as Record<string, unknown>;
          return obj.success === true && typeof obj.data === 'object' && obj.data !== null;
        };

        const isPaginated = (r: unknown): r is PaginatedUnitCategories => {
          if (typeof r !== 'object' || r === null) return false;
          const obj = r as Record<string, unknown>;
          return Array.isArray(obj.data);
        };

        if (isWrapped(response) && isPaginated(response.data)) {
          return response.data.data;
        }

        if (isPaginated(response)) {
          return response.data;
        }

        return [];
      },
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


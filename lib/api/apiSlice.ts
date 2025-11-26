import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AuthResponse,
  SigninRequest,
  SignupRequest,
} from '@/types/auth';
import type {
  Category,
  CreateCategoryDto,
  PaginatedCategories,
  UpdateCategoryDto,
} from '@/types/category';
import type {
  CreateManufacturerDto,
  Manufacturer,
  PaginatedManufacturers,
  UpdateManufacturerDto,
} from '@/types/manufacturer';
import type {
  CreateProductDto,
  PaginatedProducts,
  Product,
  UpdateProductDto,
} from '@/types/product';
import type {
  CreateUnitOfMeasureDto,
  PaginatedUnitOfMeasures,
  UnitOfMeasure,
  UpdateUnitOfMeasureDto,
} from '@/types/uom';
import type { ImportResult } from '@/types/product-import';
import { API_BASE_URL } from '@/lib/config/api';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getAuthToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    // Only set Content-Type for non-FormData requests
    // RTK Query will automatically handle FormData and set proper Content-Type
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Products',
    'Product',
    'Categories',
    'Category',
    'Manufacturers',
    'Manufacturer',
    'UnitOfMeasures',
    'UnitOfMeasure',
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (data) => ({
        url: '/auth/signup',
        method: 'POST',
        body: data,
      }),
    }),
    signin: builder.mutation<AuthResponse, SigninRequest>({
      query: (data) => ({
        url: '/auth/login',
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    refreshTokens: builder.mutation<AuthResponse, void>({
      query: () => {
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('refreshToken')
            : null;
        return {
          url: '/auth/refresh',
          method: 'POST',
          headers: refreshToken
            ? { authorization: `Bearer ${refreshToken}` }
            : undefined,
        };
      },
    }),

    // Product endpoints
    getProducts: builder.query<
      PaginatedProducts,
      {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      }
    >({
      query: (params = {}) => {
        const { page = 1, limit = 10, search, sortBy, sortOrder } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (search) query.set('search', search);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/products?${query.toString()}`;
      },
      providesTags: ['Products'],
    }),
    getAllProducts: builder.query<
      Product[],
      {
        search?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      } | void
    >({
      query: (params) => {
        if (!params) return '/products/all';
        const { search, sortBy, sortOrder } = params;
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        const queryString = query.toString();
        return `/products/all${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Products'],
    }),
    getProduct: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation<Product, CreateProductDto>({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation<Product, { id: string; data: UpdateProductDto }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        'Products',
      ],
    }),
    deleteProduct: builder.mutation<Product, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
    uploadProductImage: builder.mutation<
      Product,
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/products/${id}/image`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        'Products',
      ],
    }),
    getProductsByCategory: builder.query<Product[], string>({
      query: (categoryId) => `/products/category/${categoryId}`,
      providesTags: ['Products'],
    }),
    getProductsByManufacturer: builder.query<Product[], string>({
      query: (manufacturerId) => `/products/manufacturer/${manufacturerId}`,
      providesTags: ['Products'],
    }),
    getLowStockProducts: builder.query<Product[], void>({
      query: () => '/products/low-stock',
      providesTags: ['Products'],
    }),
    importProducts: builder.mutation<{ imported: number; errors?: string[] }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/products/import',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Products'],
    }),
    downloadProductTemplate: builder.query<Blob, void>({
      query: () => ({
        url: '/products/import/template',
        responseHandler: (response) => response.blob(),
      }),
      keepUnusedDataFor: 0, // Don't cache blob responses (non-serializable)
    }),
    importProductsSimple: builder.mutation<ImportResult, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/products/import/simple',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Products'],
    }),

    // Category endpoints
    getCategories: builder.query<
      PaginatedCategories,
      {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      }
    >({
      query: (params = {}) => {
        const { page = 1, limit = 10, search, sortBy, sortOrder } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (search) query.set('search', search);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/categories?${query.toString()}`;
      },
      providesTags: ['Categories'],
    }),
    getAllCategories: builder.query<Category[], void>({
      query: () => '/categories/all',
      providesTags: ['Categories'],
    }),
    getCategory: builder.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),
    createCategory: builder.mutation<Category, CreateCategoryDto>({
      query: (data) => ({
        url: '/categories',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation<Category, { id: string; data: UpdateCategoryDto }>({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        'Categories',
      ],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categories'],
    }),

    // Manufacturer endpoints
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
        const { page = 1, limit = 10, search, sortBy, sortOrder } = params;
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

    // Unit of Measure endpoints
    getUnitOfMeasures: builder.query<
      PaginatedUnitOfMeasures,
      {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      }
    >({
      query: (params = {}) => {
        const { page = 1, limit = 10, search, sortBy, sortOrder } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (search) query.set('search', search);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/unit-of-measures?${query.toString()}`;
      },
      providesTags: ['UnitOfMeasures'],
    }),
    getAllUnitOfMeasures: builder.query<
      UnitOfMeasure[],
      {
        search?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      } | void
    >({
      query: (params) => {
        if (!params) return '/unit-of-measures/all';
        const { search, sortBy, sortOrder } = params || {};
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        const queryString = query.toString();
        return `/unit-of-measures/all${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['UnitOfMeasures'],
    }),
    getUnitOfMeasure: builder.query<UnitOfMeasure, string>({
      query: (id) => `/unit-of-measures/${id}`,
      providesTags: (result, error, id) => [{ type: 'UnitOfMeasure', id }],
    }),
    createUnitOfMeasure: builder.mutation<UnitOfMeasure, CreateUnitOfMeasureDto>({
      query: (data) => ({
        url: '/unit-of-measures',
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
        url: `/unit-of-measures/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'UnitOfMeasure', id },
        'UnitOfMeasures',
      ],
    }),
    deleteUnitOfMeasure: builder.mutation<UnitOfMeasure, string>({
      query: (id) => ({
        url: `/unit-of-measures/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UnitOfMeasures'],
    }),
  }),
});

export const {
  // Auth
  useSignupMutation,
  useSigninMutation,
  useLogoutMutation,
  useRefreshTokensMutation,
  // Products
  useGetProductsQuery,
  useGetAllProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImageMutation,
  useGetProductsByCategoryQuery,
  useGetProductsByManufacturerQuery,
  useGetLowStockProductsQuery,
  useImportProductsMutation,
  useDownloadProductTemplateQuery,
  useLazyDownloadProductTemplateQuery,
  useImportProductsSimpleMutation,
  // Categories
  useGetCategoriesQuery,
  useGetAllCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  // Manufacturers
  useGetManufacturersQuery,
  useGetAllManufacturersQuery,
  useGetManufacturerQuery,
  useCreateManufacturerMutation,
  useUpdateManufacturerMutation,
  useDeleteManufacturerMutation,
  // Unit of Measures
  useGetUnitOfMeasuresQuery,
  useGetAllUnitOfMeasuresQuery,
  useGetUnitOfMeasureQuery,
  useCreateUnitOfMeasureMutation,
  useUpdateUnitOfMeasureMutation,
  useDeleteUnitOfMeasureMutation,
} = apiSlice;


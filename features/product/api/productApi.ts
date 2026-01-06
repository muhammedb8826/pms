import { baseApi } from '@/features/common/api/baseApi';
import type {
  CreateProductDto,
  PaginatedProducts,
  Product,
  UpdateProductDto,
  ImportResult,
  BinCardEntry,
} from '@/features/product/types';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
        const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = params;
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

    getProductBinCard: builder.query<BinCardEntry[], string>({
      query: (productId) => `/products/${productId}/bin-card`,
      // We use a specific tag so the bin card refreshes when products/sales/purchases change
      providesTags: (result, error, id) => [{ type: 'Product', id }, 'Products'],
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
    importProducts: builder.mutation<ImportResult, File>({
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
  }),
});

export const {
  useGetProductsQuery,
  useGetAllProductsQuery,
  useGetProductQuery,
  useLazyGetProductQuery,
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
  useGetProductBinCardQuery,
} = productApi;


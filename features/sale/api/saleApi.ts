import { baseApi } from '@/features/common/api/baseApi';
import type {
  CreateSaleDto,
  UpdateSaleDto,
  PaginatedSales,
  Sale,
  CreateSaleItemDto,
  UpdateSaleItemDto,
} from '@/features/sale/types';

function unwrapResponse<T>(response: { data?: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: T }).data;
    if (data !== undefined) {
      return data;
    }
  }
  return response as T;
}

type GetSalesParams = {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  sortBy?: 'date' | 'totalAmount' | 'status' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
};

export const saleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<PaginatedSales, GetSalesParams | void>({
      query: (params) => {
        const queryParams = params
          ? ({ ...params } as Record<string, string | number | boolean | undefined>)
          : undefined;
        return {
          url: '/sales',
          params: queryParams,
        };
      },
      transformResponse: unwrapResponse<PaginatedSales>,
      providesTags: ['Sales'],
    }),
    getSale: builder.query<Sale, string>({
      query: (id) => `/sales/${id}`,
      transformResponse: unwrapResponse<Sale>,
      providesTags: (result, error, id) => [{ type: 'Sale', id }, 'Sales'],
    }),
    createSale: builder.mutation<Sale, CreateSaleDto>({
      query: (dto) => ({
        url: '/sales',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: (result) => [
        'Sales',
        'Products',
        'Batches',
        ...(result ? [{ type: 'Sale', id: result.id } as const] : []),
      ],
    }),
    updateSale: builder.mutation<Sale, { id: string; data: UpdateSaleDto }>({
      query: ({ id, data }) => ({
        url: `/sales/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id, data }) => {
        const tags: (('Sales' | 'Products' | 'Batches') | { type: 'Sale'; id: string })[] = [
          'Sales',
          { type: 'Sale', id },
        ];
        if (data?.status) {
          tags.push('Products', 'Batches');
        }
        return tags;
      },
    }),
    deleteSale: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sales/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sales'],
    }),

    // Sale Items
    getSaleItems: builder.query<unknown, { saleId?: string; productId?: string } | void>({
      query: (params) => {
        const queryParams = params
          ? ({ ...params } as Record<string, string | number | boolean | undefined>)
          : undefined;
        return {
          url: '/sale-items',
          params: queryParams,
        };
      },
      providesTags: ['SaleItems'],
    }),
    getSaleItem: builder.query<unknown, string>({
      query: (id) => `/sale-items/${id}`,
      providesTags: (result, error, id) => [{ type: 'SaleItem', id }, 'SaleItems'],
    }),
    createSaleItem: builder.mutation<unknown, { saleId: string; data: CreateSaleItemDto }>({
      query: ({ saleId, data }) => ({
        url: `/sale-items/sale/${saleId}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { saleId }) => [
        'SaleItems',
        'Sales',
        { type: 'Sale', id: saleId } as const,
        'Products',
        'Batches',
      ],
    }),
    updateSaleItem: builder.mutation<unknown, { id: string; data: UpdateSaleItemDto }>({
      query: ({ id, data }) => ({
        url: `/sale-items/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['SaleItems', 'Sales'],
    }),
    deleteSaleItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sale-items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SaleItems', 'Sales'],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useGetSaleItemsQuery,
  useGetSaleItemQuery,
  useCreateSaleItemMutation,
  useUpdateSaleItemMutation,
  useDeleteSaleItemMutation,
} = saleApi;



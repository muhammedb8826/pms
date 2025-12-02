import { baseApi } from '@/features/common/api/baseApi';
import type {
  Quotation,
  CreateQuotationDto,
  UpdateQuotationDto,
} from '@/features/quotation/types';
import { unwrapResponseData } from '@/types/api-response';

export type QuotationStatusFilter =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export interface GetQuotationsParams {
  customerId?: string;
  status?: QuotationStatusFilter;
  startDate?: string;
  endDate?: string;
}

function unwrap<T>(response: unknown): T {
  return unwrapResponseData<T>(response) ?? (response as T);
}

export const quotationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuotations: builder.query<Quotation[], GetQuotationsParams | void>({
      query: (params) => ({
        url: '/quotations',
        ...(params && { params }),
      }),
      transformResponse: unwrap<Quotation[]>,
      providesTags: ['Quotations'],
    }),
    getQuotation: builder.query<Quotation, string>({
      query: (id) => `/quotations/${id}`,
      transformResponse: unwrap<Quotation>,
      providesTags: (result, error, id) => [
        { type: 'Quotation', id },
        'Quotations',
      ],
    }),
    createQuotation: builder.mutation<Quotation, CreateQuotationDto>({
      query: (dto) => ({
        url: '/quotations',
        method: 'POST',
        body: dto,
      }),
      transformResponse: unwrap<Quotation>,
      invalidatesTags: ['Quotations'],
    }),
    updateQuotation: builder.mutation<
      Quotation,
      { id: string; data: UpdateQuotationDto }
    >({
      query: ({ id, data }) => ({
        url: `/quotations/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: unwrap<Quotation>,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotation', id },
        'Quotations',
      ],
    }),
    deleteQuotation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quotations'],
    }),
    acceptQuotation: builder.mutation<Quotation, string>({
      query: (id) => ({
        url: `/quotations/${id}/accept`,
        method: 'POST',
      }),
      transformResponse: unwrap<Quotation>,
      invalidatesTags: (result, error, id) => [
        { type: 'Quotation', id },
        'Quotations',
      ],
    }),
    getQuotationSaleDraft: builder.query<
      unknown,
      string
    >({
      query: (id) => `/quotations/${id}/sale-draft`,
      transformResponse: (resp: unknown) => resp,
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useGetQuotationQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useAcceptQuotationMutation,
  useGetQuotationSaleDraftQuery,
  useLazyGetQuotationSaleDraftQuery,
} = quotationApi;



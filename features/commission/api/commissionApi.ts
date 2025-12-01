import { baseApi } from '@/features/common/api/baseApi';
import type {
  Commission,
  CommissionConfig,
  CreateCommissionConfigDto,
  UpdateCommissionConfigDto,
  PayCommissionDto,
  UpdateCommissionDto,
  CommissionFilters,
  SalespersonSummary,
  LeaderboardEntry,
} from '@/features/commission/types';

function unwrapResponse<T>(response: { data?: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: T }).data;
    if (data !== undefined) {
      return data;
    }
  }
  return response as T;
}

export const commissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Commission Config endpoints
    getCommissionConfigs: builder.query<CommissionConfig[], void>({
      query: () => '/commission-configs',
      transformResponse: unwrapResponse<CommissionConfig[]>,
      providesTags: ['CommissionConfigs'],
    }),
    getCommissionConfig: builder.query<CommissionConfig, string>({
      query: (id) => `/commission-configs/${id}`,
      transformResponse: unwrapResponse<CommissionConfig>,
      providesTags: (result, error, id) => [{ type: 'CommissionConfig', id }],
    }),
    createCommissionConfig: builder.mutation<CommissionConfig, CreateCommissionConfigDto>({
      query: (data) => ({ url: '/commission-configs', method: 'POST', body: data }),
      transformResponse: unwrapResponse<CommissionConfig>,
      invalidatesTags: ['CommissionConfigs'],
    }),
    updateCommissionConfig: builder.mutation<CommissionConfig, { id: string; data: UpdateCommissionConfigDto }>({
      query: ({ id, data }) => ({ url: `/commission-configs/${id}`, method: 'PATCH', body: data }),
      transformResponse: unwrapResponse<CommissionConfig>,
      invalidatesTags: (result, error, { id }) => [{ type: 'CommissionConfig', id }, 'CommissionConfigs'],
    }),
    deleteCommissionConfig: builder.mutation<void, string>({
      query: (id) => ({ url: `/commission-configs/${id}`, method: 'DELETE' }),
      transformResponse: unwrapResponse<void>,
      invalidatesTags: ['CommissionConfigs'],
    }),

    // Commission endpoints
    getCommissions: builder.query<Commission[], CommissionFilters | void>({
      query: (filters) => {
        if (!filters) return '/commissions';
        const query = new URLSearchParams();
        if (filters.salespersonId) query.set('salespersonId', filters.salespersonId);
        if (filters.status) query.set('status', filters.status);
        if (filters.startDate) query.set('startDate', filters.startDate);
        if (filters.endDate) query.set('endDate', filters.endDate);
        if (filters.saleId) query.set('saleId', filters.saleId);
        const qs = query.toString();
        return `/commissions${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<Commission[]>,
      providesTags: ['Commissions'],
    }),
    getCommissionsBySalesperson: builder.query<Commission[], string>({
      query: (salespersonId) => `/commissions/salesperson/${salespersonId}`,
      transformResponse: unwrapResponse<Commission[]>,
      providesTags: ['Commissions'],
    }),
    getSalespersonSummary: builder.query<
      SalespersonSummary,
      { salespersonId: string; startDate?: string; endDate?: string }
    >({
      query: ({ salespersonId, startDate, endDate }) => {
        const query = new URLSearchParams();
        if (startDate) query.set('startDate', startDate);
        if (endDate) query.set('endDate', endDate);
        const qs = query.toString();
        return `/commissions/salesperson/${salespersonId}/summary${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<SalespersonSummary>,
      providesTags: ['Commissions'],
    }),
    getLeaderboard: builder.query<LeaderboardEntry[], { limit?: number } | void>({
      query: (params) => {
        if (!params) return '/commissions/leaderboard';
        const query = new URLSearchParams();
        if (params.limit) query.set('limit', String(params.limit));
        const qs = query.toString();
        return `/commissions/leaderboard${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<LeaderboardEntry[]>,
      providesTags: ['Commissions'],
    }),
    getCommission: builder.query<Commission, string>({
      query: (id) => `/commissions/${id}`,
      transformResponse: unwrapResponse<Commission>,
      providesTags: (result, error, id) => [{ type: 'Commission', id }],
    }),
    payCommission: builder.mutation<Commission, { id: string; data: PayCommissionDto }>({
      query: ({ id, data }) => ({ url: `/commissions/${id}/pay`, method: 'PATCH', body: data }),
      transformResponse: unwrapResponse<Commission>,
      invalidatesTags: (result, error, { id }) => [{ type: 'Commission', id }, 'Commissions'],
    }),
    updateCommission: builder.mutation<Commission, { id: string; data: UpdateCommissionDto }>({
      query: ({ id, data }) => ({ url: `/commissions/${id}`, method: 'PATCH', body: data }),
      transformResponse: unwrapResponse<Commission>,
      invalidatesTags: (result, error, { id }) => [{ type: 'Commission', id }, 'Commissions'],
    }),
    deleteCommission: builder.mutation<void, string>({
      query: (id) => ({ url: `/commissions/${id}`, method: 'DELETE' }),
      transformResponse: unwrapResponse<void>,
      invalidatesTags: ['Commissions'],
    }),
  }),
});

export const {
  useGetCommissionConfigsQuery,
  useGetCommissionConfigQuery,
  useCreateCommissionConfigMutation,
  useUpdateCommissionConfigMutation,
  useDeleteCommissionConfigMutation,
  useGetCommissionsQuery,
  useGetCommissionsBySalespersonQuery,
  useGetSalespersonSummaryQuery,
  useGetLeaderboardQuery,
  useGetCommissionQuery,
  usePayCommissionMutation,
  useUpdateCommissionMutation,
  useDeleteCommissionMutation,
} = commissionApi;


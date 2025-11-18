import { baseApi } from '@/features/common/api/baseApi';
import type {
  DashboardStats,
  ChartResponse,
  PaginatedTableData,
} from '@/features/dashboard/types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
    getSalesChart: builder.query<
      ChartResponse,
      { timeRange?: '7d' | '30d' | '90d' }
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.timeRange) query.set('timeRange', params.timeRange);
        const queryString = query.toString();
        return `/dashboard/charts/sales${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Dashboard'],
    }),
    getRevenueChart: builder.query<
      ChartResponse,
      { timeRange?: '7d' | '30d' | '90d' }
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.timeRange) query.set('timeRange', params.timeRange);
        const queryString = query.toString();
        return `/dashboard/charts/revenue${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Dashboard'],
    }),
    getPurchasesChart: builder.query<
      ChartResponse,
      { timeRange?: '7d' | '30d' | '90d' }
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.timeRange) query.set('timeRange', params.timeRange);
        const queryString = query.toString();
        return `/dashboard/charts/purchases${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Dashboard'],
    }),
    getTableData: builder.query<
      PaginatedTableData,
      {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      }
    >({
      query: (params = {}) => {
        const { page = 1, limit = 10, sortBy, sortOrder } = params;
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('limit', String(limit));
        if (sortBy) query.set('sortBy', sortBy);
        if (sortOrder) query.set('sortOrder', sortOrder);
        return `/dashboard/table-data?${query.toString()}`;
      },
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetSalesChartQuery,
  useGetRevenueChartQuery,
  useGetPurchasesChartQuery,
  useGetTableDataQuery,
} = dashboardApi;


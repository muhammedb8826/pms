"use client";

import {
  useGetDashboardStatsQuery,
  useGetSalesChartQuery,
  useGetRevenueChartQuery,
  useGetPurchasesChartQuery,
  useGetTableDataQuery,
} from '@/features/dashboard/api/dashboardApi';
import type {
  DashboardStats,
  ChartResponse,
  PaginatedTableData,
} from '@/features/dashboard/types';

export function useDashboardStats() {
  const query = useGetDashboardStatsQuery();
  
  // Unwrap dashboard stats from possible wrapped response
  type WrappedResponse = {
    success?: boolean;
    data?: DashboardStats;
  };
  
  const raw = query.data as DashboardStats | WrappedResponse | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse).data
      : (raw as DashboardStats | undefined);
  
  return {
    ...query,
    data,
  };
}

export function useSalesChart(timeRange: '7d' | '30d' | '90d' = '90d') {
  const query = useGetSalesChartQuery({ timeRange });
  
  // Unwrap chart data from possible wrapped response
  type WrappedResponse = {
    success?: boolean;
    data?: ChartResponse;
  };
  
  const raw = query.data as ChartResponse | WrappedResponse | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse).data
      : (raw as ChartResponse | undefined);
  
  return {
    ...query,
    data,
  };
}

export function useRevenueChart(timeRange: '7d' | '30d' | '90d' = '90d') {
  const query = useGetRevenueChartQuery({ timeRange });
  
  // Unwrap chart data from possible wrapped response
  type WrappedResponse = {
    success?: boolean;
    data?: ChartResponse;
  };
  
  const raw = query.data as ChartResponse | WrappedResponse | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse).data
      : (raw as ChartResponse | undefined);
  
  return {
    ...query,
    data,
  };
}

export function usePurchasesChart(timeRange: '7d' | '30d' | '90d' = '90d') {
  const query = useGetPurchasesChartQuery({ timeRange });
  
  // Unwrap chart data from possible wrapped response
  type WrappedResponse = {
    success?: boolean;
    data?: ChartResponse;
  };
  
  const raw = query.data as ChartResponse | WrappedResponse | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse).data
      : (raw as ChartResponse | undefined);
  
  return {
    ...query,
    data,
  };
}

export function useDashboardTableData(
  page = 1,
  limit = 10,
  sortBy?: string,
  sortOrder?: 'ASC' | 'DESC'
) {
  const query = useGetTableDataQuery({
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  // Unwrap table data from possible wrapped response
  type WrappedResponse = {
    success?: boolean;
    data?: PaginatedTableData;
  };
  
  const raw = query.data as PaginatedTableData | WrappedResponse | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse).data
      : (raw as PaginatedTableData | undefined);
  
  return {
    ...query,
    data,
  };
}


"use client";

import {
  useGetCommissionsQuery,
  useGetCommissionsBySalespersonQuery,
  useGetSalespersonSummaryQuery,
  useGetLeaderboardQuery,
  useGetCommissionQuery,
  usePayCommissionMutation,
  useUpdateCommissionMutation,
  useDeleteCommissionMutation,
} from '@/features/commission/api/commissionApi';
import type { CommissionFilters, SalespersonSummary, LeaderboardEntry } from '@/features/commission/types';

export function useCommissions(filters?: CommissionFilters) {
  const query = useGetCommissionsQuery(filters || undefined);
  return {
    commissions: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCommissionsBySalesperson(salespersonId?: string) {
  const query = useGetCommissionsBySalespersonQuery(salespersonId || '', { skip: !salespersonId });
  return {
    commissions: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSalespersonSummary(
  salespersonId?: string,
  options?: { startDate?: string; endDate?: string }
) {
  const query = useGetSalespersonSummaryQuery(
    { salespersonId: salespersonId || '', ...options },
    { skip: !salespersonId }
  );
  return {
    summary: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useLeaderboard(limit?: number) {
  const query = useGetLeaderboardQuery(limit ? { limit } : undefined);
  return {
    leaderboard: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCommission(id?: string) {
  return useGetCommissionQuery(id || '', { skip: !id });
}

export function usePayCommission() {
  const [mutate, result] = usePayCommissionMutation();
  return {
    mutateAsync: ({ id, data }: { id: string; data: { paidDate?: string; notes?: string } }) =>
      mutate({ id, data }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateCommission() {
  const [mutate, result] = useUpdateCommissionMutation();
  return {
    mutateAsync: ({
      id,
      data,
    }: {
      id: string;
      data: { commissionRate?: number; commissionAmount?: number; notes?: string };
    }) => mutate({ id, data }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteCommission() {
  const [mutate, result] = useDeleteCommissionMutation();
  return {
    mutateAsync: (id: string) => mutate(id),
    isPending: result.isLoading,
    ...result,
  };
}


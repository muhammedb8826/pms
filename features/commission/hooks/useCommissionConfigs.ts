"use client";

import {
  useGetCommissionConfigsQuery,
  useGetCommissionConfigQuery,
  useCreateCommissionConfigMutation,
  useUpdateCommissionConfigMutation,
  useDeleteCommissionConfigMutation,
} from '@/features/commission/api/commissionApi';
import type { CreateCommissionConfigDto, UpdateCommissionConfigDto } from '@/features/commission/types';

export function useCommissionConfigs() {
  const query = useGetCommissionConfigsQuery();
  return {
    configs: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCommissionConfig(id?: string) {
  return useGetCommissionConfigQuery(id || '', { skip: !id });
}

export function useCreateCommissionConfig() {
  const [mutate, result] = useCreateCommissionConfigMutation();
  return {
    mutateAsync: (data: CreateCommissionConfigDto) => mutate(data),
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateCommissionConfig() {
  const [mutate, result] = useUpdateCommissionConfigMutation();
  return {
    mutateAsync: ({ id, data }: { id: string; data: UpdateCommissionConfigDto }) => mutate({ id, data }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteCommissionConfig() {
  const [mutate, result] = useDeleteCommissionConfigMutation();
  return {
    mutateAsync: (id: string) => mutate(id),
    isPending: result.isLoading,
    ...result,
  };
}


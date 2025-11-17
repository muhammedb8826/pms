"use client";

import {
  useGetCreditsQuery,
  useGetCreditSummaryQuery,
  useGetCreditQuery,
  useCreateCreditMutation,
  useUpdateCreditMutation,
  useRecordPaymentMutation,
  useDeleteCreditMutation,
} from '@/features/credit/api/creditApi';
import type {
  Credit,
  PaginatedCredits,
  CreditSummary,
  CreditFilters,
  CreateCreditDto,
  UpdateCreditDto,
  RecordPaymentDto,
} from '@/features/credit/types';

export function useCredits(
  page = 1,
  limit = 10,
  filters?: Omit<CreditFilters, 'page' | 'limit'>
) {
  const query = useGetCreditsQuery({
    page,
    limit,
    ...filters,
  });

  // Handle different API response formats:
  // - Direct: { credits: [...], total: ... }
  // - Wrapped: { success: true, data: { credits: [...], total: ... } }
  type WrappedResponse = {
    success: boolean;
    data: PaginatedCredits;
  };

  const rawData = query.data as PaginatedCredits | WrappedResponse | undefined;
  let creditsArray: Credit[] = [];
  let totalCount = 0;

  if (rawData) {
    // Check if response is wrapped: { success: true, data: { ... } }
    if ('success' in rawData && rawData.success && rawData.data) {
      const innerData = rawData.data;
      creditsArray = Array.isArray(innerData?.credits) ? innerData.credits : [];
      totalCount = innerData?.total ?? 0;
    } else if (!('success' in rawData) && 'credits' in rawData && Array.isArray(rawData.credits)) {
      // Direct format: { credits: [...], total: ... }
      creditsArray = rawData.credits;
      totalCount = rawData.total ?? 0;
    } else if (Array.isArray(rawData)) {
      // Array directly
      creditsArray = rawData;
    }
  }

  return {
    credits: creditsArray,
    total: totalCount,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useCredit(id?: string) {
  const query = useGetCreditQuery(id || '', { skip: !id });
  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as Credit | WrappedResponse<Credit> | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse<Credit>).data
      : (raw as Credit | undefined);
  return { ...query, data } as typeof query & { data: Credit | undefined };
}

export function useCreditSummary(type?: 'PAYABLE' | 'RECEIVABLE') {
  const query = useGetCreditSummaryQuery(type ? { type } : undefined);
  type WrappedResponse = {
    success?: boolean;
    data?: CreditSummary;
  };
  const raw = query.data as CreditSummary | WrappedResponse | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse).data
      : (raw as CreditSummary | undefined);
  return { ...query, data } as typeof query & { data: CreditSummary | undefined };
}

function unwrapCredit<T extends Credit>(response: unknown): T {
  if (!response || typeof response !== 'object') throw new Error('Empty credit response');
  if ('id' in response && typeof (response as { id?: unknown }).id === 'string')
    return response as T;
  if ('credit' in response) {
    const credit = (response as { credit?: unknown }).credit;
    if (credit && typeof credit === 'object' && 'id' in credit) {
      return credit as T;
    }
  }
  if ('data' in response) {
    const data = (response as { data?: unknown }).data;
    if (data && typeof data === 'object') {
      if ('id' in data && typeof (data as { id?: unknown }).id === 'string') {
        return data as T;
      }
      if ('data' in data) {
        const inner = (data as { data?: unknown }).data;
        if (inner && typeof inner === 'object' && 'id' in inner) {
          return inner as T;
        }
      }
    }
  }
  throw new Error('Unable to unwrap credit response');
}

export function useCreateCredit() {
  const [createCredit, result] = useCreateCreditMutation();
  return {
    mutateAsync: async (dto: CreateCreditDto) => {
      const response = await createCredit(dto).unwrap();
      return unwrapCredit(response);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateCredit() {
  const [updateCredit, result] = useUpdateCreditMutation();
  return {
    mutateAsync: async ({ id, dto }: { id: string; dto: UpdateCreditDto }) => {
      const response = await updateCredit({ id, data: dto }).unwrap();
      return unwrapCredit(response);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useRecordPayment() {
  const [recordPayment, result] = useRecordPaymentMutation();
  return {
    mutateAsync: async ({ id, dto }: { id: string; dto: RecordPaymentDto }) => {
      const response = await recordPayment({ id, data: dto }).unwrap();
      return unwrapCredit(response);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteCredit() {
  const [deleteCredit, result] = useDeleteCreditMutation();
  return {
    mutateAsync: async (id: string) => {
      const response = await deleteCredit(id).unwrap();
      return response;
    },
    isPending: result.isLoading,
    ...result,
  };
}


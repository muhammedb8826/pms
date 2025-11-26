"use client";

import {
  useGetPaymentMethodsQuery,
  useGetPaymentMethodQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
} from '@/features/payment-method/api/paymentMethodApi';
import type { PaymentMethod } from '@/features/payment-method/types';

export function usePaymentMethods(options?: { includeInactive?: boolean }) {
  const query = useGetPaymentMethodsQuery({ includeInactive: options?.includeInactive });

  // Handle different API response formats
  type WrappedResponse<T> = {
    success: boolean;
    data: T;
  };

  const rawData = query.data as PaymentMethod[] | WrappedResponse<PaymentMethod[]> | undefined;
  let paymentMethods: PaymentMethod[] = [];

  if (rawData) {
    if (Array.isArray(rawData)) {
      paymentMethods = rawData;
    } else if ('success' in rawData && rawData.success && Array.isArray(rawData.data)) {
      paymentMethods = rawData.data;
    }
  }

  return {
    paymentMethods,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function usePaymentMethod(id?: string) {
  const query = useGetPaymentMethodQuery(id || '', { skip: !id });
  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as PaymentMethod | WrappedResponse<PaymentMethod> | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse<PaymentMethod>).data
      : (raw as PaymentMethod | undefined);
  return { ...query, data } as typeof query & { data: PaymentMethod | undefined };
}

function unwrapPaymentMethod<T extends PaymentMethod>(response: unknown): T {
  if (!response || typeof response !== 'object') throw new Error('Empty payment method response');
  if ('id' in response && typeof (response as { id?: unknown }).id === 'string')
    return response as T;
  if ('paymentMethod' in response) {
    const paymentMethod = (response as { paymentMethod?: unknown }).paymentMethod;
    if (paymentMethod && typeof paymentMethod === 'object' && 'id' in paymentMethod) {
      return paymentMethod as T;
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
  throw new Error('Unable to unwrap payment method response');
}

export function useCreatePaymentMethod() {
  const [createPaymentMethod, result] = useCreatePaymentMethodMutation();
  return {
    mutateAsync: async (dto: Parameters<typeof createPaymentMethod>[0]) => {
      const response = await createPaymentMethod(dto).unwrap();
      return unwrapPaymentMethod(response);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdatePaymentMethod() {
  const [updatePaymentMethod, result] = useUpdatePaymentMethodMutation();
  return {
    mutateAsync: async ({
      id,
      dto,
    }: {
      id: string;
      dto: Parameters<typeof updatePaymentMethod>[0]['data'];
    }) => {
      const response = await updatePaymentMethod({ id, data: dto }).unwrap();
      return unwrapPaymentMethod(response);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeletePaymentMethod() {
  const [deletePaymentMethod, result] = useDeletePaymentMethodMutation();
  return {
    mutateAsync: async (id: Parameters<typeof deletePaymentMethod>[0]) => {
      const response = await deletePaymentMethod(id).unwrap();
      return response;
    },
    isPending: result.isLoading,
    ...result,
  };
}


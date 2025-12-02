"use client";

import {
  useGetQuotationsQuery,
  useGetQuotationQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useAcceptQuotationMutation,
  useGetQuotationSaleDraftQuery,
  useLazyGetQuotationSaleDraftQuery,
  type GetQuotationsParams,
} from '@/features/quotation/api/quotationApi';
import type {
  Quotation,
  CreateQuotationDto,
  UpdateQuotationDto,
} from '@/features/quotation/types';

type WrappedList<T> = { success?: boolean; data?: T };

export function useQuotations(params?: GetQuotationsParams) {
  const query = useGetQuotationsQuery(params);
  const raw = query.data as Quotation[] | WrappedList<Quotation[]> | undefined;

  let quotations: Quotation[] = [];
  if (raw) {
    if (Array.isArray(raw)) {
      quotations = raw;
    } else if ('success' in raw && raw.success && Array.isArray(raw.data)) {
      quotations = raw.data;
    }
  }

  return {
    ...query,
    quotations,
    error: query.error
      ? (query.error as { message?: string }).message || 'An error occurred'
      : null,
  };
}

export function useQuotation(id?: string) {
  const query = useGetQuotationQuery(id || '', { skip: !id });
  const raw = query.data as Quotation | WrappedList<Quotation> | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedList<Quotation>).data
      : (raw as Quotation | undefined);
  return { ...query, data } as typeof query & { data: Quotation | undefined };
}

export function useCreateQuotation() {
  const [mutate, result] = useCreateQuotationMutation();
  return { mutateAsync: (dto: CreateQuotationDto) => mutate(dto), ...result };
}

export function useUpdateQuotation() {
  const [mutate, result] = useUpdateQuotationMutation();
  return {
    mutateAsync: ({ id, data }: { id: string; data: UpdateQuotationDto }) =>
      mutate({ id, data }),
    ...result,
  };
}

export function useDeleteQuotation() {
  const [mutate, result] = useDeleteQuotationMutation();
  return { mutateAsync: mutate, ...result };
}

export function useAcceptQuotation() {
  const [mutate, result] = useAcceptQuotationMutation();
  return { mutateAsync: mutate, ...result };
}

export function useQuotationSaleDraft(id?: string) {
  const query = useGetQuotationSaleDraftQuery(id || '', {
    skip: !id,
  });
  return query;
}

export { useLazyGetQuotationSaleDraftQuery };



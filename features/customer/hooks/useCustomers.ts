"use client";

import {
  useGetCustomersQuery,
  useGetAllCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from '@/features/customer/api/customerApi';
import type { Customer, PaginatedCustomers, CreateCustomerDto, UpdateCustomerDto } from '@/features/customer/types';

export function useCustomers(
  page = 1,
  limit = 10,
  options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
) {
  const query = useGetCustomersQuery({ page, limit, search: options?.search, sortBy: options?.sortBy, sortOrder: options?.sortOrder });

  type WrappedResponse = { success?: boolean; data?: PaginatedCustomers };
  const raw = query.data as PaginatedCustomers | WrappedResponse | undefined;
  let customers: Customer[] = [];
  let total = 0;
  if (raw) {
    if ('success' in raw && raw.success && raw.data) {
      customers = raw.data.customers ?? [];
      total = raw.data.total ?? 0;
    } else if ('customers' in raw) {
      customers = raw.customers ?? [];
      total = raw.total ?? 0;
    }
  }

  return {
    customers,
    total,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useAllCustomers(options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  return useGetAllCustomersQuery(options || undefined);
}

export function useCustomer(id?: string) {
  const query = useGetCustomerQuery(id || '', { skip: !id });
  type Wrapped<T> = { success?: boolean; data?: T };
  const raw = query.data as Customer | Wrapped<Customer> | undefined;
  const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as Wrapped<Customer>).data : (raw as Customer | undefined);
  return { ...query, data } as typeof query & { data: Customer | undefined };
}

export function useCreateCustomer() {
  const [mutate, result] = useCreateCustomerMutation();
  return { mutateAsync: mutate, isPending: result.isLoading, ...result };
}

export function useUpdateCustomer() {
  const [mutate, result] = useUpdateCustomerMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: UpdateCustomerDto }) => mutate({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteCustomer() {
  const [mutate, result] = useDeleteCustomerMutation();
  return { mutateAsync: mutate, isPending: result.isLoading, ...result };
}



"use client";

import {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useGetPaymentStatisticsQuery,
} from '@/features/payment/api/paymentApi';
import type {
  Payment,
  PaginatedPayments,
  PaymentStatistics,
  PaymentFilters,
} from '@/features/payment/types';
import { extractErrorMessage } from '@/lib/utils/api-error-handler';

export function usePayments(filters?: PaymentFilters) {
  const query = useGetPaymentsQuery(filters || {});

  // Handle different API response formats
  type WrappedResponse<T> = {
    success: boolean;
    data: T;
  };

  const rawData = query.data as
    | PaginatedPayments
    | WrappedResponse<PaginatedPayments>
    | undefined;
  let payments: Payment[] = [];
  let total = 0;

  if (rawData) {
    if ('payments' in rawData && Array.isArray(rawData.payments)) {
      payments = rawData.payments;
      total = rawData.total ?? 0;
    } else if (
      'success' in rawData &&
      rawData.success &&
      rawData.data &&
      'payments' in rawData.data
    ) {
      payments = rawData.data.payments;
      total = rawData.data.total ?? 0;
    }
  }

  return {
    payments,
    total,
    loading: query.isLoading,
    error: query.error ? extractErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}

export function usePayment(id?: string) {
  const query = useGetPaymentQuery(id || '', { skip: !id });
  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as Payment | WrappedResponse<Payment> | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse<Payment>).data
      : (raw as Payment | undefined);
  return { ...query, data } as typeof query & { data: Payment | undefined };
}

export function usePaymentStatistics(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const query = useGetPaymentStatisticsQuery(params || {});
  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as
    | PaymentStatistics
    | WrappedResponse<PaymentStatistics>
    | undefined;
  const data =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as WrappedResponse<PaymentStatistics>).data
      : (raw as PaymentStatistics | undefined);
  return {
    ...query,
    data,
  } as typeof query & { data: PaymentStatistics | undefined };
}

// Helper functions
export function getPaymentType(
  payment: Payment
): 'PURCHASE' | 'SALE' | 'CREDIT' {
  if (payment.purchase) return 'PURCHASE';
  if (payment.sale) return 'SALE';
  if (payment.credit) return 'CREDIT';
  return 'CREDIT'; // Default fallback
}

export function getPaymentSource(payment: Payment): string {
  if (payment.purchase) {
    return `Purchase: ${payment.purchase.invoiceNo}${
      payment.purchase.supplier ? ` - ${payment.purchase.supplier.name}` : ''
    }`;
  }
  if (payment.sale) {
    return `Sale: ${payment.sale.customer?.name || 'N/A'}`;
  }
  if (payment.credit) {
    return `Credit Payment`;
  }
  return 'Unknown';
}

/**
 * Check if a payment can be deleted based on the status of its related entity
 * @param payment The payment to check
 * @returns true if the payment can be deleted, false otherwise
 */
export function canDeletePayment(payment: Payment): boolean {
  // Check purchase status
  if (payment.purchase) {
    // Cannot delete payments for completed purchases
    if (payment.purchase.status === 'COMPLETED') {
      return false;
    }
    // Can delete for PENDING, CANCELLED, or PARTIALLY_RECEIVED
    return true;
  }

  // Check sale status
  if (payment.sale) {
    // Cannot delete payments for completed sales
    if (payment.sale.status === 'COMPLETED') {
      return false;
    }
    // Can delete for PENDING or CANCELLED
    return true;
  }

  // Check credit status
  if (payment.credit) {
    // Cannot delete payments for fully paid credits
    if (payment.credit.status === 'PAID') {
      return false;
    }
    // Can delete for PENDING, PARTIAL, or OVERDUE
    return true;
  }

  // If no related entity, allow deletion (shouldn't happen in practice)
  return true;
}

/**
 * Get the reason why a payment cannot be deleted
 * @param payment The payment to check
 * @returns Error message if payment cannot be deleted, null otherwise
 */
export function getPaymentDeleteRestriction(payment: Payment): string | null {
  if (payment.purchase && payment.purchase.status === 'COMPLETED') {
    return 'Cannot delete payment for a completed purchase. Cancel the purchase first if you need to modify payments.';
  }
  if (payment.sale && payment.sale.status === 'COMPLETED') {
    return 'Cannot delete payment for a completed sale. Cancel the sale first if you need to modify payments.';
  }
  if (payment.credit && payment.credit.status === 'PAID') {
    return 'Cannot delete payment for a fully paid credit. The credit must be in PENDING or PARTIAL status.';
  }
  return null;
}


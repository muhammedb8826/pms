// Import PaymentMethod type from payment-method feature
import type { PaymentMethod as PaymentMethodEntity } from '@/features/payment-method/types';

export interface SupplierSummary {
  id: string;
  name: string;
  email?: string;
  address?: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface PurchaseSummary {
  id: string;
  invoiceNo: string;
  date?: string;
  totalAmount: string;
  paidAmount: string;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PARTIALLY_RECEIVED';
  supplier?: SupplierSummary;
}

export interface SaleSummary {
  id: string;
  totalAmount: string;
  paidAmount: string;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  customer?: CustomerSummary;
}

export interface CreditSummary {
  id: string;
  type: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
}

export interface Payment {
  id: string;
  amount: string;
  paymentMethod: PaymentMethodEntity | null;
  paymentMethodId: string | null;
  referenceNumber: string | null;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
  credit: CreditSummary | null;
  purchase: PurchaseSummary | null;
  sale: SaleSummary | null;
}

export interface PaginatedPayments {
  payments: Payment[];
  total: number;
}

export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  byPaymentMethod: Array<{
    method: string;
    methodId: string;
    total: number;
    count: number;
  }>;
  byType: Array<{
    type: string;
    total: number;
    count: number;
  }>;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  purchaseId?: string;
  saleId?: string;
  creditId?: string;
  sortBy?: 'paymentDate' | 'amount' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}


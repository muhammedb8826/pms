"use client";

import {
  useGetSalesReportQuery,
  useGetPurchaseReportQuery,
  useGetInventoryReportQuery,
  useGetFinancialReportQuery,
  useGetCommissionReportQuery,
  useGetProductPerformanceReportQuery,
} from '@/features/report/api/reportApi';
import type {
  ReportQueryDto,
  SalesReport,
  PurchaseReport,
  InventoryReport,
  FinancialReport,
  CommissionReport,
  ProductPerformanceReport,
} from '@/features/report/types';

export function useSalesReport(params?: ReportQueryDto) {
  const query = useGetSalesReportQuery(params || undefined);
  return {
    report: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function usePurchaseReport(params?: ReportQueryDto) {
  const query = useGetPurchaseReportQuery(params || undefined);
  return {
    report: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useInventoryReport() {
  const query = useGetInventoryReportQuery();
  return {
    report: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useFinancialReport(
  params?: Omit<ReportQueryDto, 'productId' | 'categoryId' | 'customerId' | 'supplierId' | 'salespersonId'>
) {
  const query = useGetFinancialReportQuery(params || undefined);
  return {
    report: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCommissionReport(
  params?: Omit<ReportQueryDto, 'productId' | 'categoryId' | 'customerId' | 'supplierId'>
) {
  const query = useGetCommissionReportQuery(params || undefined);
  return {
    report: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useProductPerformanceReport(
  params?: Omit<ReportQueryDto, 'customerId' | 'supplierId' | 'salespersonId'>
) {
  const query = useGetProductPerformanceReportQuery(params || undefined);
  return {
    report: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}


import { baseApi } from '@/features/common/api/baseApi';
import type {
  ReportQueryDto,
  SalesReport,
  PurchaseReport,
  InventoryReport,
  FinancialReport,
  CommissionReport,
  ProductPerformanceReport,
} from '@/features/report/types';

function unwrapResponse<T>(response: { data?: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: T }).data;
    if (data !== undefined) {
      return data;
    }
  }
  return response as T;
}

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSalesReport: builder.query<SalesReport, ReportQueryDto | void>({
      query: (params) => {
        if (!params) return '/reports/sales';
        const query = new URLSearchParams();
        if (params.period) query.set('period', params.period);
        if (params.startDate) query.set('startDate', params.startDate);
        if (params.endDate) query.set('endDate', params.endDate);
        if (params.customerId) query.set('customerId', params.customerId);
        if (params.salespersonId) query.set('salespersonId', params.salespersonId);
        if (params.categoryId) query.set('categoryId', params.categoryId);
        if (params.productId) query.set('productId', params.productId);
        const qs = query.toString();
        return `/reports/sales${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<SalesReport>,
      providesTags: ['Reports'],
    }),
    getPurchaseReport: builder.query<PurchaseReport, ReportQueryDto | void>({
      query: (params) => {
        if (!params) return '/reports/purchases';
        const query = new URLSearchParams();
        if (params.period) query.set('period', params.period);
        if (params.startDate) query.set('startDate', params.startDate);
        if (params.endDate) query.set('endDate', params.endDate);
        if (params.supplierId) query.set('supplierId', params.supplierId);
        if (params.categoryId) query.set('categoryId', params.categoryId);
        if (params.productId) query.set('productId', params.productId);
        const qs = query.toString();
        return `/reports/purchases${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<PurchaseReport>,
      providesTags: ['Reports'],
    }),
    getInventoryReport: builder.query<InventoryReport, void>({
      query: () => '/reports/inventory',
      transformResponse: unwrapResponse<InventoryReport>,
      providesTags: ['Reports'],
    }),
    getFinancialReport: builder.query<FinancialReport, Omit<ReportQueryDto, 'productId' | 'categoryId' | 'customerId' | 'supplierId' | 'salespersonId'> | void>({
      query: (params) => {
        if (!params) return '/reports/financial';
        const query = new URLSearchParams();
        if (params.period) query.set('period', params.period);
        if (params.startDate) query.set('startDate', params.startDate);
        if (params.endDate) query.set('endDate', params.endDate);
        const qs = query.toString();
        return `/reports/financial${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<FinancialReport>,
      providesTags: ['Reports'],
    }),
    getCommissionReport: builder.query<CommissionReport, Omit<ReportQueryDto, 'productId' | 'categoryId' | 'customerId' | 'supplierId'> | void>({
      query: (params) => {
        if (!params) return '/reports/commissions';
        const query = new URLSearchParams();
        if (params.period) query.set('period', params.period);
        if (params.startDate) query.set('startDate', params.startDate);
        if (params.endDate) query.set('endDate', params.endDate);
        if (params.salespersonId) query.set('salespersonId', params.salespersonId);
        const qs = query.toString();
        return `/reports/commissions${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<CommissionReport>,
      providesTags: ['Reports'],
    }),
    getProductPerformanceReport: builder.query<ProductPerformanceReport, Omit<ReportQueryDto, 'customerId' | 'supplierId' | 'salespersonId'> | void>({
      query: (params) => {
        if (!params) return '/reports/products';
        const query = new URLSearchParams();
        if (params.period) query.set('period', params.period);
        if (params.startDate) query.set('startDate', params.startDate);
        if (params.endDate) query.set('endDate', params.endDate);
        if (params.productId) query.set('productId', params.productId);
        if (params.categoryId) query.set('categoryId', params.categoryId);
        const qs = query.toString();
        return `/reports/products${qs ? `?${qs}` : ''}`;
      },
      transformResponse: unwrapResponse<ProductPerformanceReport>,
      providesTags: ['Reports'],
    }),
  }),
});

export const {
  useGetSalesReportQuery,
  useGetPurchaseReportQuery,
  useGetInventoryReportQuery,
  useGetFinancialReportQuery,
  useGetCommissionReportQuery,
  useGetProductPerformanceReportQuery,
} = reportApi;


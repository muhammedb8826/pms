import { createApi, fetchBaseQuery, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://pms-api.qenenia.com/api/v1';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const baseQueryFn = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getAuthToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    // Only set Content-Type for non-FormData requests
    // RTK Query will automatically handle FormData and set proper Content-Type
    return headers;
  },
});

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQueryFn(args, api, extraOptions);

  // If there's already an error (HTTP error status), return it
  if ('error' in result) {
    return result;
  }

  // Check if response has success: false (even if HTTP status might be 200)
  // Transform it into an error format that RTK Query will treat as an error
  if (
    result.data &&
    typeof result.data === 'object' &&
    'success' in result.data &&
    (result.data as { success?: boolean }).success === false
  ) {
    // Extract status code from the error data if available, otherwise use 500
    const errorData = result.data as { statusCode?: number; [key: string]: unknown };
    const statusCode = errorData.statusCode || 500;
    
    return {
      error: {
        status: statusCode,
        data: result.data,
      } as FetchBaseQueryError,
    };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Products',
    'Product',
    'Sales',
    'Sale',
    'SaleItems',
    'SaleItem',
    'Customers',
    'Customer',
    'Batches',
    'Batch',
    'Categories',
    'Category',
    'Manufacturers',
    'Manufacturer',
    'UnitOfMeasures',
    'UnitOfMeasure',
    'UnitCategories',
    'UnitCategory',
    'Suppliers',
    'Supplier',
    'Purchases',
    'Purchase',
    'PurchaseItems',
    'PurchaseItem',
  ],
  endpoints: () => ({}),
});


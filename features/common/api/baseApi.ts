import { createApi, fetchBaseQuery, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_BASE_URL } from '@/lib/config/api';

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
  let result = await baseQueryFn(args, api, extraOptions);

  // Handle 401 Unauthorized - attempt token refresh
  if (
    result.error &&
    result.error.status === 401 &&
    typeof window !== 'undefined'
  ) {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Skip refresh attempt for auth endpoints to avoid infinite loops
    const endpoint = typeof args === 'string' ? args : args.url || '';
    const isAuthEndpoint = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout'].some(
      (path) => endpoint.includes(path)
    );

    if (refreshToken && !isAuthEndpoint) {
      try {
        // Attempt to refresh tokens
        const refreshResult = await baseQueryFn(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (
          refreshResult.data &&
          typeof refreshResult.data === 'object' &&
          'tokens' in refreshResult.data
        ) {
          const tokens = (refreshResult.data as { tokens: { accessToken: string; refreshToken: string } }).tokens;
          // Store new tokens
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('tokens', JSON.stringify(tokens));

          // Retry original request with new token
          result = await baseQueryFn(args, api, extraOptions);
        } else {
          // Refresh failed - clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokens');
          localStorage.removeItem('user');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } catch {
        // Refresh failed - clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } else if (!isAuthEndpoint) {
      // No refresh token available - clear storage and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
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
    'Users',
    'User',
    'Account',
    'Credits',
    'Credit',
    'Dashboard',
  ],
  endpoints: () => ({}),
});


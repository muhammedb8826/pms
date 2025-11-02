import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://pms-api.daminaa.org/api/v1';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const baseQuery = fetchBaseQuery({
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

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Products',
    'Product',
    'Categories',
    'Category',
    'Manufacturers',
    'Manufacturer',
    'UnitOfMeasures',
    'UnitOfMeasure',
    'UnitCategories',
    'UnitCategory',
  ],
  endpoints: () => ({}),
});


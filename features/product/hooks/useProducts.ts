"use client";

import {
  useGetProductsQuery,
  useGetAllProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImageMutation,
  useGetProductsByCategoryQuery,
  useGetProductsByManufacturerQuery,
  useGetLowStockProductsQuery,
} from '@/features/product/api/productApi';
import type { Product, PaginatedProducts } from '@/features/product/types';

type MaybeWrappedProduct = Product | { data?: unknown } | { product?: Product };

function unwrapProductResponse(response: unknown): Product {
  if (!response || typeof response !== 'object') {
    throw new Error('Empty product response');
  }

  if ('id' in response && typeof (response as { id?: unknown }).id === 'string') {
    return response as Product;
  }

  if ('product' in response) {
    const product = (response as { product?: unknown }).product;
    if (product && typeof product === 'object' && 'id' in product) {
      return product as Product;
    }
  }

  if ('data' in response) {
    const data = (response as { data?: unknown }).data;
    if (data && typeof data === 'object') {
      if ('id' in data && typeof (data as { id?: unknown }).id === 'string') {
        return data as Product;
      }
      if ('data' in data) {
        const inner = (data as { data?: unknown }).data;
        if (inner && typeof inner === 'object' && 'id' in inner) {
          return inner as Product;
        }
      }
    }
  }

  throw new Error('Unable to unwrap product response');
}

// Wrapper hooks to maintain compatibility with existing code
export function useProducts(
  page = 1,
  limit = 10,
  options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
) {
  const query = useGetProductsQuery({
    page,
    limit,
    search: options?.search,
    sortBy: options?.sortBy,
    sortOrder: options?.sortOrder,
  });

  // Handle different API response formats:
  // - Direct: { products: [...], total: ... }
  // - Wrapped: { success: true, data: { products: [...], total: ... } }
  type WrappedResponse = {
    success: boolean;
    data: PaginatedProducts;
  };
  
  const rawData = query.data as PaginatedProducts | WrappedResponse | undefined;
  let productsArray: Product[] = [];
  let totalCount = 0;

  if (rawData) {
    // Check if response is wrapped: { success: true, data: { ... } }
    if ('success' in rawData && rawData.success && rawData.data) {
      const innerData = rawData.data;
      productsArray = Array.isArray(innerData?.products) ? innerData.products : [];
      totalCount = innerData?.total ?? 0;
    } else if (!('success' in rawData) && 'products' in rawData && Array.isArray(rawData.products)) {
      // Direct format: { products: [...], total: ... }
      productsArray = rawData.products;
      totalCount = rawData.total ?? 0;
    } else if (Array.isArray(rawData)) {
      // Array directly
      productsArray = rawData;
    }
  }

  return {
    products: productsArray,
    total: totalCount,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useAllProducts(options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  return useGetAllProductsQuery(options || undefined);
}

export function useProduct(id?: string) {
  const query = useGetProductQuery(id || '', { skip: !id });

  type WrappedResponse<T> = { success?: boolean; data?: T };
  const raw = query.data as Product | WrappedResponse<Product> | undefined;
  const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as WrappedResponse<Product>).data : (raw as Product | undefined);

  return { ...query, data } as typeof query & { data: Product | undefined };
}

export function useCreateProduct() {
  const [createProduct, result] = useCreateProductMutation();
  return {
    mutateAsync: async (dto: Parameters<typeof createProduct>[0]) => {
      const response = await createProduct(dto).unwrap();
      return unwrapProductResponse(response as MaybeWrappedProduct);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateProduct() {
  const [updateProduct, result] = useUpdateProductMutation();
  return {
    mutateAsync: async ({ id, dto }: { id: string; dto: Parameters<typeof updateProduct>[0]['data'] }) => {
      const response = await updateProduct({ id, data: dto }).unwrap();
      return unwrapProductResponse(response as MaybeWrappedProduct);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteProduct() {
  const [deleteProduct, result] = useDeleteProductMutation();
  return {
    mutateAsync: async (id: Parameters<typeof deleteProduct>[0]) => {
      const response = await deleteProduct(id).unwrap();
      return response;
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useUploadProductImage() {
  const [uploadImage, result] = useUploadProductImageMutation();
  return {
    mutateAsync: async ({ id, file }: { id: string; file: File }) => {
      const response = await uploadImage({ id, file }).unwrap();
      return unwrapProductResponse(response as MaybeWrappedProduct);
    },
    isPending: result.isLoading,
    ...result,
  };
}

export function useProductsByCategory(categoryId: string) {
  return useGetProductsByCategoryQuery(categoryId, { skip: !categoryId });
}

export function useProductsByManufacturer(manufacturerId: string) {
  return useGetProductsByManufacturerQuery(manufacturerId, { skip: !manufacturerId });
}

export function useLowStockProducts() {
  return useGetLowStockProductsQuery();
}


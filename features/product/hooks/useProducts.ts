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

  return {
    products: query.data?.products ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error ? (query.error as { message?: string })?.message || 'An error occurred' : null,
    refetch: query.refetch,
  };
}

export function useAllProducts(options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  return useGetAllProductsQuery(options || undefined);
}

export function useProduct(id?: string) {
  return useGetProductQuery(id || '', { skip: !id });
}

export function useCreateProduct() {
  const [createProduct, result] = useCreateProductMutation();
  return {
    mutateAsync: createProduct,
    isPending: result.isLoading,
    ...result,
  };
}

export function useUpdateProduct() {
  const [updateProduct, result] = useUpdateProductMutation();
  return {
    mutateAsync: ({ id, dto }: { id: string; dto: Parameters<typeof updateProduct>[0]['data'] }) =>
      updateProduct({ id, data: dto }),
    isPending: result.isLoading,
    ...result,
  };
}

export function useDeleteProduct() {
  const [deleteProduct, result] = useDeleteProductMutation();
  return {
    mutateAsync: deleteProduct,
    isPending: result.isLoading,
    ...result,
  };
}

export function useUploadProductImage() {
  const [uploadImage, result] = useUploadProductImageMutation();
  return {
    mutateAsync: ({ id, file }: { id: string; file: File }) => uploadImage({ id, file }),
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


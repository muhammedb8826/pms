"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import type { CreateProductDto, PaginatedProducts, Product, UpdateProductDto } from '@/types/product';

export function useProducts(
  page = 1,
  limit = 10,
  options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
) {
  const query = useQuery<PaginatedProducts>({
    queryKey: ['products', { page, limit, search: options?.search ?? '', sortBy: options?.sortBy ?? '', sortOrder: options?.sortOrder ?? '' }],
    queryFn: () => productService.getProducts(page, limit, options),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  return {
    products: query.data?.products ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useProduct(id?: string) {
  return useQuery<Product>({
    queryKey: id ? ['product', id] : ['product', 'none'],
    queryFn: () => productService.getProduct(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProductDto) => productService.createProduct(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) => productService.updateProduct(id, dto),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['product', v.id] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}



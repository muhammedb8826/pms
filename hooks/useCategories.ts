"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import type { Category, CreateCategoryDto, PaginatedCategories, UpdateCategoryDto } from '@/types/category';

const queryKeys = {
  list: (page: number, limit: number) => ['categories', { page, limit }] as const,
  all: ['categories', 'all'] as const,
  detail: (id: string) => ['category', id] as const,
};

export function useCategories(
  page = 1,
  limit = 10,
  options?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
) {
  const query = useQuery<PaginatedCategories>({
    queryKey: ['categories', { page, limit, search: options?.search ?? '', sortBy: options?.sortBy ?? '', sortOrder: options?.sortOrder ?? '' }],
    queryFn: () => categoryService.getCategories(page, limit, options),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  return {
    categories: query.data?.categories ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useCategory(id?: string) {
  const query = useQuery<Category>({
    queryKey: id ? queryKeys.detail(id) : ['category', 'none'],
    queryFn: () => categoryService.getCategory(id as string),
    enabled: Boolean(id),
  });

  return query;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => categoryService.createCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) => categoryService.updateCategory(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}



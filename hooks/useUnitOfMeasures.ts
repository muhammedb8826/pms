"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitOfMeasureService } from '@/services/unitOfMeasureService';
import type { CreateUnitOfMeasureDto, PaginatedUnitOfMeasures, UnitOfMeasure, UpdateUnitOfMeasureDto } from '@/types/uom';

export function useUnitOfMeasures(page = 1, limit = 10, options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  const query = useQuery<PaginatedUnitOfMeasures>({
    queryKey: ['unitOfMeasures', { page, limit, search: options?.search ?? '', sortBy: options?.sortBy ?? '', sortOrder: options?.sortOrder ?? '' }],
    queryFn: () => unitOfMeasureService.getUnitOfMeasures(page, limit, options),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  return {
    unitOfMeasures: query.data?.unitOfMeasures ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useAllUnitOfMeasures(options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  return useQuery<UnitOfMeasure[]>({
    queryKey: ['unitOfMeasures', 'all', options ?? {}],
    queryFn: () => unitOfMeasureService.getAllUnitOfMeasures(options),
    staleTime: 60_000,
  });
}

export function useCreateUnitOfMeasure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUnitOfMeasureDto) => unitOfMeasureService.createUnitOfMeasure(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unitOfMeasures'] });
      qc.invalidateQueries({ queryKey: ['unitOfMeasures', 'all'] });
    },
  });
}

export function useUpdateUnitOfMeasure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUnitOfMeasureDto }) => unitOfMeasureService.updateUnitOfMeasure(id, dto),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['unitOfMeasures'] });
      qc.invalidateQueries({ queryKey: ['unitOfMeasures', 'all'] });
      qc.invalidateQueries({ queryKey: ['unitOfMeasure', v.id] });
    },
  });
}

export function useDeleteUnitOfMeasure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unitOfMeasureService.deleteUnitOfMeasure(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unitOfMeasures'] });
      qc.invalidateQueries({ queryKey: ['unitOfMeasures', 'all'] });
    },
  });
}



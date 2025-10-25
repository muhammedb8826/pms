"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { manufacturerService } from '@/services/manufacturerService';
import type { CreateManufacturerDto, Manufacturer, PaginatedManufacturers, UpdateManufacturerDto } from '@/types/manufacturer';

export function useManufacturers(page = 1, limit = 10, options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  const query = useQuery<PaginatedManufacturers>({
    queryKey: ['manufacturers', { page, limit, search: options?.search ?? '', sortBy: options?.sortBy ?? '', sortOrder: options?.sortOrder ?? '' }],
    queryFn: () => manufacturerService.getManufacturers(page, limit, options),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  return {
    manufacturers: query.data?.manufacturers ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useAllManufacturers(options?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  return useQuery<Manufacturer[]>({
    queryKey: ['manufacturers', 'all', options ?? {}],
    queryFn: () => manufacturerService.getAllManufacturers(options),
    staleTime: 60_000,
  });
}

export function useCreateManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateManufacturerDto) => manufacturerService.createManufacturer(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manufacturers'] });
      qc.invalidateQueries({ queryKey: ['manufacturers', 'all'] });
    },
  });
}

export function useUpdateManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateManufacturerDto }) => manufacturerService.updateManufacturer(id, dto),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['manufacturers'] });
      qc.invalidateQueries({ queryKey: ['manufacturers', 'all'] });
      qc.invalidateQueries({ queryKey: ['manufacturer', v.id] });
    },
  });
}

export function useDeleteManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => manufacturerService.deleteManufacturer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manufacturers'] });
      qc.invalidateQueries({ queryKey: ['manufacturers', 'all'] });
    },
  });
}



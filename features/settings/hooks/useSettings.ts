"use client";

import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from '@/features/settings/api/settingsApi';
import type {
  PharmacySettings,
  UpdatePharmacySettingsDto,
} from '@/features/settings/types';
import { useUploadSettingsLogoMutation } from '@/features/settings/api/settingsApi';

export function usePharmacySettings() {
  const query = useGetSettingsQuery();

  const settings: PharmacySettings =
    (query.data as PharmacySettings | undefined) ??
    ({
      id: '',
      pharmacyName: 'My Pharmacy',
      pharmacyLogoUrl: null,
      address: null,
      phone: null,
      email: null,
      createdAt: '',
      updatedAt: '',
    } satisfies PharmacySettings);

  return { ...query, settings };
}

export function useUpdatePharmacySettings() {
  const [mutate, result] = useUpdateSettingsMutation();
  return {
    mutateAsync: (dto: UpdatePharmacySettingsDto) => mutate(dto),
    isPending: result.isLoading,
    ...result,
  };
}

export function useUploadPharmacyLogo() {
  const [mutate, result] = useUploadSettingsLogoMutation();
  return {
    mutateAsync: (file: File) => mutate(file),
    isPending: result.isLoading,
    ...result,
  };
}



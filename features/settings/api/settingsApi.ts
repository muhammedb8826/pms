import { baseApi } from '@/features/common/api/baseApi';
import type {
  PharmacySettings,
  UpdatePharmacySettingsDto,
} from '@/features/settings/types';
import { unwrapResponseData } from '@/types/api-response';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<PharmacySettings, void>({
      query: () => '/settings',
      transformResponse: (resp: unknown) =>
        unwrapResponseData<PharmacySettings>(resp) ??
        (resp as PharmacySettings),
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<
      PharmacySettings,
      UpdatePharmacySettingsDto
    >({
      query: (body) => ({
        url: '/settings',
        method: 'PATCH',
        body,
      }),
      transformResponse: (resp: unknown) =>
        unwrapResponseData<PharmacySettings>(resp) ??
        (resp as PharmacySettings),
      invalidatesTags: ['Settings'],
    }),
    uploadSettingsLogo: builder.mutation<PharmacySettings, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/settings/logo',
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (resp: unknown) =>
        unwrapResponseData<PharmacySettings>(resp) ??
        (resp as PharmacySettings),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useUploadSettingsLogoMutation,
} = settingsApi;



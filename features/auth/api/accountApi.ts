"use client";

import { baseApi } from "@/features/common/api/baseApi";
import type { User } from "@/features/auth/types";

interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

type UpdateProfileRequest = UpdateProfilePayload | FormData;

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface AccountResponse {
  success?: boolean;
  data?: User;
}

export const accountApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<User, void>({
      query: () => ({
        url: "/account/me",
        method: "GET",
      }),
      providesTags: [{ type: "Account", id: "ME" }, { type: "User", id: "ME" }],
    }),
    updateProfile: build.mutation<AccountResponse, UpdateProfileRequest>({
      query: (data) => ({
        url: "/account/profile",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "Account", id: "ME" }, { type: "User", id: "ME" }],
    }),
    changePassword: build.mutation<AccountResponse, ChangePasswordPayload>({
      query: (data) => ({
        url: "/account/password",
        method: "PATCH",
        body: data,
      }),
    }),
    uploadAvatar: build.mutation<AccountResponse, FormData>({
      query: (formData) => ({
        url: "/account/avatar",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "Account", id: "ME" }, { type: "User", id: "ME" }],
    }),
    deleteAvatar: build.mutation<AccountResponse, void>({
      query: () => ({
        url: "/account/avatar",
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Account", id: "ME" }, { type: "User", id: "ME" }],
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} = accountApi;



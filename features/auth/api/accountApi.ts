"use client";

import { baseApi } from "@/features/common/api/baseApi";

interface UpdateAccountPayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  address?: string;
}

type UpdateAccountRequest = UpdateAccountPayload | FormData;

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AccountResponse {
  success?: boolean;
  data?: unknown;
}

export const accountApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    updateAccount: build.mutation<AccountResponse, UpdateAccountRequest>({
      query: (data) => ({
        url: "/users/me",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "Account", id: "ME" }, { type: "User", id: "ME" }],
    }),
    changePassword: build.mutation<AccountResponse, ChangePasswordPayload>({
      query: (data) => ({
        url: "/users/me/password",
        method: "PATCH",
        body: data,
      }),
    }),
  }),
});

export const { useUpdateAccountMutation, useChangePasswordMutation } = accountApi;



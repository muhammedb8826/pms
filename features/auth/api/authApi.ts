import { baseApi } from '@/features/common/api/baseApi';
import type {
  AuthResponse,
  SigninRequest,
  SignupRequest,
} from '@/features/auth/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (data) => ({
        url: '/signup',
        method: 'POST',
        body: data,
      }),
    }),
    signin: builder.mutation<AuthResponse, SigninRequest>({
      query: (data) => ({
        url: '/signin',
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
    }),
    refreshTokens: builder.mutation<AuthResponse, void>({
      query: () => {
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('refreshToken')
            : null;
        return {
          url: '/refresh',
          method: 'POST',
          headers: refreshToken
            ? { authorization: `Bearer ${refreshToken}` }
            : undefined,
        };
      },
    }),
  }),
});

export const {
  useSignupMutation,
  useSigninMutation,
  useLogoutMutation,
  useRefreshTokensMutation,
} = authApi;


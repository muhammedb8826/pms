export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  phone: string;
  address?: string | null;
  profile?: string | null;
  roles: string | string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
}

export interface SignupRequest {
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  address: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}


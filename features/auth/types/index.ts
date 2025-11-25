// Role enum matching backend Role enum
export type AuthRole = 
  | 'USER'
  | 'ADMIN'
  | 'PHARMACIST_IN_CHARGE'
  | 'PHARMACIST'
  | 'PHARMACY_TECHNICIAN'
  | 'STORE_MANAGER'
  | 'CASHIER'
  | 'INVENTORY_CONTROLLER'
  | 'PROCUREMENT_OFFICER'
  | 'FINANCE_OFFICER'
  | 'DELIVERY_PERSON';

export interface User {
  id: string;
  email: string;
  role: AuthRole;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null; // Legacy field name
  avatarUrl?: string | null; // Backend returns this field
  isActive?: boolean;
  lastLoginAt?: string | null;
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


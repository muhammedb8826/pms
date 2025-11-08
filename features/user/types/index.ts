"use client";

export const USER_ROLES = [
  'USER',
  'ADMIN',
  'RECEPTION',
  'GRAPHIC_DESIGNER',
  'OPERATOR',
  'FINANCE',
  'STORE_REPRESENTATIVE',
  'PURCHASER',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export type UserGender = (typeof USER_GENDERS)[number];

export interface User {
  id: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  gender: UserGender;
  phone: string;
  address?: string | null;
  profile?: string | null;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export type UserSortBy = 'createdAt' | 'firstName' | 'lastName' | 'email';
export type UserSortOrder = 'ASC' | 'DESC';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | '';
  isActive?: boolean | '';
  gender?: UserGender | '';
  sortBy?: UserSortBy;
  sortOrder?: UserSortOrder;
}

export interface CreateUserInput {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  gender?: UserGender;
  phone: string;
  address?: string | null;
  roles?: UserRole[];
  isActive?: boolean;
  profile?: File | null;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  middleName?: string | null;
  lastName?: string | null;
  gender?: UserGender;
  phone?: string;
  address?: string | null;
  roles?: UserRole[];
  isActive?: boolean;
  profile?: File | null | false;
}

export interface UsersByRoleParams {
  role?: UserRole;
}



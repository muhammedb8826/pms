export interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodDto {
  name: string;
  description?: string;
  isActive?: boolean;
  icon?: string;
  sortOrder?: number;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  icon?: string;
  sortOrder?: number;
}


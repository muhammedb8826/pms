export enum CommissionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum CommissionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  TIERED = 'TIERED',
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CategorySummary {
  id: string;
  name: string;
}

export interface SaleSummary {
  id: string;
  totalAmount: number;
  date: string;
  customer?: {
    id: string;
    name: string;
  };
}

export interface Commission {
  id: string;
  sale: SaleSummary;
  saleId: string;
  salesperson: UserSummary;
  salespersonId: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  notes: string | null;
  paidDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionConfig {
  id: string;
  user: UserSummary | null;
  userId: string | null;
  category: CategorySummary | null;
  categoryId: string | null;
  type: CommissionType;
  rate: number;
  minSaleAmount: number | null;
  maxCommission: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommissionConfigDto {
  userId?: string | null;
  categoryId?: string | null;
  type?: CommissionType;
  rate: number;
  minSaleAmount?: number | null;
  maxCommission?: number | null;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateCommissionConfigDto {
  userId?: string | null;
  categoryId?: string | null;
  type?: CommissionType;
  rate?: number;
  minSaleAmount?: number | null;
  maxCommission?: number | null;
  isActive?: boolean;
  notes?: string;
}

export interface PayCommissionDto {
  paidDate?: string;
  notes?: string;
}

export interface UpdateCommissionDto {
  commissionRate?: number;
  commissionAmount?: number;
  notes?: string;
}

export interface SalespersonSummary {
  totalSales: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  salesCount: number;
  averageSaleAmount: number;
  averageCommissionRate: number;
}

export interface LeaderboardEntry {
  salesperson: UserSummary;
  totalCommission: number;
  salesCount: number;
  totalSales: number;
}

export interface CommissionFilters {
  salespersonId?: string;
  status?: CommissionStatus;
  startDate?: string;
  endDate?: string;
  saleId?: string;
}


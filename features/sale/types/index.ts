export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface SaleItem {
  id: string;
  sale?: Sale;
  product: {
    id: string;
    name: string;
    productCode?: string;
    category?: { id: string; name: string };
    strength?: string;
    dosageForm?: string;
    defaultUom?: { name: string };
  };
  batch: {
    id: string;
    batchNumber: string;
    expiryDate?: string;
    quantity?: number;
    purchasePrice?: number;
    sellingPrice?: number;
  };
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice: number;
  notes?: string | null;
}

export interface Sale {
  id: string;
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  salesperson?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  salespersonId?: string;
  date: string; // YYYY-MM-DD
  totalAmount: number | string; // backend may return string
  paidAmount?: number | string; // optional, used for vouchers
  status: SaleStatus;
  notes?: string | null;
  items: SaleItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSaleItemDto {
  productId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice?: number;
  notes?: string;
}

export interface UpdateSaleItemDto {
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  totalPrice?: number;
  notes?: string;
}

export interface CreateSaleDto {
  customerId: string;
  date: string; // YYYY-MM-DD
  status?: SaleStatus;
  notes?: string;
  items: CreateSaleItemDto[];
  paidAmount?: number;
  paymentMethodId?: string;
  salespersonId?: string; // Optional - if not provided, uses current logged-in user
}

export interface UpdateSaleDto {
  date?: string;
  status?: SaleStatus;
  notes?: string;
  items?: CreateSaleItemDto[]; // backend accepts full items array for recalculation
  paidAmount?: number;
  paymentMethodId?: string;
  salespersonId?: string;
}

export interface PaginatedSales {
  sales: Sale[];
  total: number;
}



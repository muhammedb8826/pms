export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface SaleItem {
  id: string;
  sale?: Sale;
  product: {
    id: string;
    name: string;
    category?: { id: string; name: string };
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
  date: string; // YYYY-MM-DD
  totalAmount: number | string; // backend may return string
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
}

export interface UpdateSaleDto {
  date?: string;
  status?: SaleStatus;
  notes?: string;
  items?: CreateSaleItemDto[]; // backend accepts full items array for recalculation
}

export interface PaginatedSales {
  sales: Sale[];
  total: number;
}



export type PurchaseStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PARTIALLY_RECEIVED';

export interface Supplier {
  id: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category?: Category;
}

export interface UOM {
  id: string;
  name: string;
  abbreviation: string;
}

export interface PurchaseItem {
  id?: string;
  purchase?: Purchase;
  product: Product;
  uom?: UOM | null;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string | null;
}

export interface Purchase {
  id: string;
  supplier: Supplier;
  invoiceNo: string;
  date: string;
  totalAmount: number;
  status: PurchaseStatus;
  notes?: string | null;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseItemDto {
  productId: string;
  uomId?: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitCost: number;
  totalCost?: number;
  notes?: string;
}

export interface UpdatePurchaseItemDto {
  productId?: string;
  uomId?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
  notes?: string;
}

export interface CreatePurchaseDto {
  supplierId: string;
  invoiceNo: string;
  date: string;
  status?: PurchaseStatus;
  notes?: string;
  items: CreatePurchaseItemDto[];
}

export interface UpdatePurchaseDto {
  supplierId?: string;
  invoiceNo?: string;
  date?: string;
  status?: PurchaseStatus;
  notes?: string;
  items?: CreatePurchaseItemDto[];
}

export interface PaginatedPurchases {
  purchases: Purchase[];
  total: number;
}


export interface BatchProductRef {
  id: string;
  name: string;
  category?: { id: string; name: string };
}

export interface BatchSupplierRef {
  id: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface Batch {
  id: string;
  product: BatchProductRef;
  supplier: BatchSupplierRef;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  createdAt: string;
}

export interface CreateBatchDto {
  productId: string;
  supplierId: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface UpdateBatchDto {
  productId?: string;
  supplierId?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: number;
  purchasePrice?: number;
  sellingPrice?: number;
}


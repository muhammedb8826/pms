export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  RECALLED = 'RECALLED',
  QUARANTINED = 'QUARANTINED',
  DAMAGED = 'DAMAGED',
  RETURNED = 'RETURNED',
}

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
  manufacturingDate: string | null; // ISO date string (YYYY-MM-DD), optional
  expiryDate: string; // ISO date string (YYYY-MM-DD)
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  status: BatchStatus; // Batch status (ACTIVE, EXPIRED, RECALLED, etc.)
  recalled: boolean; // Whether batch is recalled
  recallDate: string | null; // ISO date string, when batch was recalled
  recallReason: string | null; // Reason for recall
  recallReference: string | null; // FDA recall number, manufacturer reference
  quarantined: boolean; // Whether batch is quarantined
  quarantineDate: string | null; // ISO date string, when batch was quarantined
  quarantineReason: string | null; // Reason for quarantine
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface CreateBatchDto {
  productId: string; // UUID, required
  supplierId: string; // UUID, required
  batchNumber: string; // Required, unique per product
  manufacturingDate?: string; // Optional, ISO format (YYYY-MM-DD)
  expiryDate: string; // Required, ISO format (YYYY-MM-DD)
  quantity: number; // Required, minimum 0
  purchasePrice: number; // Required, minimum 0
  sellingPrice: number; // Required, minimum 0
  status?: BatchStatus; // Optional, defaults to ACTIVE
  recalled?: boolean; // Optional, defaults to false
  recallDate?: string; // Optional, ISO format (YYYY-MM-DD)
  recallReason?: string; // Optional
  recallReference?: string; // Optional
  quarantined?: boolean; // Optional, defaults to false
  quarantineDate?: string; // Optional, ISO format (YYYY-MM-DD)
  quarantineReason?: string; // Optional
}

export interface UpdateBatchDto {
  productId?: string; // Optional UUID
  supplierId?: string; // Optional UUID
  batchNumber?: string; // Optional, must be unique per product if changed
  manufacturingDate?: string; // Optional, ISO format (YYYY-MM-DD)
  expiryDate?: string; // Optional, ISO format (YYYY-MM-DD)
  quantity?: number; // Optional, minimum 0
  purchasePrice?: number; // Optional, minimum 0
  sellingPrice?: number; // Optional, minimum 0
  status?: BatchStatus; // Optional
  recalled?: boolean; // Optional
  recallDate?: string; // Optional, ISO format (YYYY-MM-DD)
  recallReason?: string; // Optional
  recallReference?: string; // Optional
  quarantined?: boolean; // Optional
  quarantineDate?: string; // Optional, ISO format (YYYY-MM-DD)
  quarantineReason?: string; // Optional
}


export interface Supplier {
  id: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  batches?: Batch[];
  purchases?: Purchase[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contact?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contact?: string;
  email?: string;
  address?: string;
}

export interface PaginatedSuppliers {
  suppliers: Supplier[];
  total: number;
}

export interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: string;
  sellingPrice: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  purchaseDate: string;
  totalAmount: string;
  status: string;
}


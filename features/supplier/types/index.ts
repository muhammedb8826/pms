export type SupplierType = 'LICENSED' | 'WALK_IN';

export interface Batch {
  id: string;
  batchNumber: string;
  expiryDate?: string;
  quantity?: number;
  purchasePrice?: string;
  sellingPrice?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  purchaseDate: string;
  totalAmount: string;
  status: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  supplierType: SupplierType;
  licenseIssueDate?: string | null;
  licenseExpiryDate?: string | null;
  tinNumber?: string | null;
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
  supplierType?: SupplierType;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  tinNumber?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contact?: string;
  email?: string;
  address?: string;
  supplierType?: SupplierType;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  tinNumber?: string;
}

export interface PaginatedSuppliers {
  suppliers: Supplier[];
  total: number;
}

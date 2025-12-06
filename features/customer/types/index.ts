export type CustomerType = 'LICENSED' | 'WALK_IN';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface Sale {
  id: string;
  date: string;
  totalAmount: string;
  status: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status: string; // ACTIVE | INACTIVE
  customerType: CustomerType;
  licenseIssueDate?: string | null;
  licenseExpiryDate?: string | null;
  tinNumber?: string | null;
  sales?: Sale[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
  customerType?: CustomerType;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  tinNumber?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
  customerType?: CustomerType;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  tinNumber?: string;
}

export interface PaginatedCustomers {
  customers: Customer[];
  total: number;
}



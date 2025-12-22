export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export interface QuotationItem {
  id: string;
  productId: string;
  productName?: string; // Optional for backward compatibility
  batchNumber?: string | null;
  expiryDate?: string | null;
  quantity: number;
  unitPrice: number | string; // API may return string
  discount: number | string; // API may return string
  totalPrice: number | string; // API may return string
  notes: string | null;
  product?: {
    id: string;
    name: string;
    productCode?: string;
    [key: string]: unknown; // Allow other product fields
  };
}

export interface Quotation {
  id: string;
  customerId?: string; // Optional for backward compatibility
  customerName?: string; // Optional for backward compatibility
  date: string;
  validUntil: string | null;
  totalAmount: number | string; // API may return string
  status: QuotationStatus;
  notes: string | null;
  salespersonId: string | null;
  salespersonName?: string | null; // Optional for backward compatibility
  items: QuotationItem[];
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    status?: string;
    [key: string]: unknown; // Allow other customer fields
  };
  salesperson?: {
    id: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    [key: string]: unknown; // Allow other salesperson fields
  };
}

export interface CreateQuotationItemDto {
  productId: string;
  batchNumber?: string | null;
  expiryDate?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice?: number;
  notes?: string | null;
}

export interface CreateQuotationDto {
  customerId: string;
  date: string;
  validUntil?: string | null;
  status?: QuotationStatus;
  notes?: string | null;
  salespersonId?: string | null;
  items: CreateQuotationItemDto[];
}

export type UpdateQuotationDto = Partial<CreateQuotationDto>;



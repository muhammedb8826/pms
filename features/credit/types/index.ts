export enum CreditType {
  PAYABLE = 'PAYABLE',
  RECEIVABLE = 'RECEIVABLE',
}

export enum CreditStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  OTHER = 'OTHER',
}

export interface SupplierSummary {
  id: string;
  name: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
}

export interface PurchaseSummary {
  id: string;
  invoiceNo: string;
}

export interface SaleSummary {
  id: string;
  invoiceNo?: string;
}

export interface Payment {
  id: string;
  amount: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  paymentDate: string;
  notes?: string | null;
  createdAt: string;
}

export interface Credit {
  id: string;
  type: CreditType;
  status: CreditStatus;
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  dueDate: string | null;
  paidDate: string | null;
  supplier: SupplierSummary | null;
  customer: CustomerSummary | null;
  purchase: PurchaseSummary | null;
  sale: SaleSummary | null;
  notes?: string | null;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditDto {
  type: CreditType;
  totalAmount: number;
  paidAmount?: number;
  supplierId?: string;
  customerId?: string;
  purchaseId?: string;
  saleId?: string;
  dueDate?: string;
  notes?: string;
}

export interface UpdateCreditDto {
  status?: CreditStatus;
  paidAmount?: number;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
}

export interface RecordPaymentDto {
  amount: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
}

export interface CreditSummary {
  totalCredits: number;
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
}

export interface PaginatedCredits {
  credits: Credit[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface CreditFilters {
  page?: number;
  limit?: number;
  type?: CreditType;
  status?: CreditStatus;
  supplierId?: string;
  customerId?: string;
  purchaseId?: string;
  saleId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}


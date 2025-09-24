import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Medicine types
export interface Medicine {
  id: number;
  name: string;
  categoryId?: number;
  category?: Pick<Category, 'id' | 'name'>;
  barcode?: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  expiryDate: string;
  manufacturingDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum MedicineForm {
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  SYRUP = 'syrup',
  INJECTION = 'injection',
  CREAM = 'cream',
  DROPS = 'drops',
  PATCH = 'patch',
  POWDER = 'powder',
  OINTMENT = 'ointment',
  GEL = 'gel',
}

export interface CreateMedicineDto {
  name: string;
  categoryId?: number;
  barcode?: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  expiryDate: string;
  manufacturingDate: string;
}

export type UpdateMedicineDto = Partial<CreateMedicineDto>;

export interface MedicineQueryParams {
  search?: string;
  form?: MedicineForm;
  categoryId?: number;
  manufacturer?: string;
  prescriptionRequired?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface MedicinesResponse {
  medicines: Medicine[];
  total: number;
  page: number;
  limit: number;
}

// Medicine API functions
export const medicineApi = {
  // Get all medicines with pagination and filters
  getAll: async (params?: MedicineQueryParams): Promise<MedicinesResponse> => {
    const response = await api.get('/medicines', { params });
    return response.data;
  },

  // Get medicine by ID
  getById: async (id: number): Promise<Medicine> => {
    const response = await api.get(`/medicines/${id}`);
    return response.data;
  },

  // Create new medicine
  create: async (data: CreateMedicineDto): Promise<Medicine> => {
    const response = await api.post('/medicines', data);
    return response.data;
  },

  // Update medicine
  update: async (id: number, data: UpdateMedicineDto): Promise<Medicine> => {
    const response = await api.patch(`/medicines/${id}`, data);
    return response.data;
  },

  // Delete medicine
  delete: async (id: number): Promise<void> => {
    await api.delete(`/medicines/${id}`);
  },

  // Get medicine by barcode
  getByBarcode: async (barcode: string): Promise<Medicine> => {
    const response = await api.get(`/medicines/barcode/${barcode}`);
    return response.data;
  },

  // Get all categories
  getCategories: async (): Promise<Array<{ id: number; name: string }>> => {
    const response = await api.get('/medicines/categories');
    return response.data;
  },

  // Get all manufacturers
  getManufacturers: async (): Promise<string[]> => {
    const response = await api.get('/medicines/manufacturers');
    return response.data;
  },
};

// Category types and API
export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export interface CategoriesResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
}

export const categoryApi = {
  list: async (params?: { search?: string; page?: number; limit?: number; isActive?: boolean }): Promise<CategoriesResponse> => {
    const response = await api.get('/categories', { params });
    return response.data;
  },
  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data;
  },
  update: async (id: number, data: UpdateCategoryDto): Promise<Category> => {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

// Suppliers
export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto extends Partial<Omit<Supplier, 'id'|'createdAt'|'updatedAt'|'isActive'>> {
  name: string;
  isActive?: boolean;
}
export type UpdateSupplierDto = Partial<CreateSupplierDto>;

export const supplierApi = {
  list: async (): Promise<Supplier[]> => {
    const res = await api.get('/suppliers');
    return res.data;
  },
  create: async (data: CreateSupplierDto): Promise<Supplier> => {
    const res = await api.post('/suppliers', data);
    return res.data;
  },
  update: async (id: number, data: UpdateSupplierDto): Promise<Supplier> => {
    const res = await api.put(`/suppliers/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};

// Customers
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto extends Partial<Omit<Customer, 'id'|'createdAt'|'updatedAt'>> {
  name: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export const customerApi = {
  list: async (): Promise<Customer[]> => {
    const res = await api.get('/customers');
    return res.data;
  },
  create: async (data: CreateCustomerDto): Promise<Customer> => {
    const res = await api.post('/customers', data);
    return res.data;
  },
  update: async (id: number, data: UpdateCustomerDto): Promise<Customer> => {
    const res = await api.put(`/customers/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};

// Users
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'cashier';
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto extends Partial<Omit<User, 'id'|'createdAt'|'updatedAt'>> {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'cashier';
}

export type UpdateUserDto = Partial<CreateUserDto>;

export const userApi = {
  list: async (): Promise<User[]> => {
    const res = await api.get('/users');
    return res.data;
  },
  create: async (data: CreateUserDto): Promise<User> => {
    const res = await api.post('/users', data);
    return res.data;
  },
  update: async (id: number, data: UpdateUserDto): Promise<User> => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Purchase Orders
export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export interface PurchaseOrderItemDto {
  medicineId: number;
  quantity: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: number;
  status?: PurchaseOrderStatus;
  orderDate: string; // ISO
  expectedDeliveryDate?: string; // ISO
  notes?: string;
  items: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  medicineId: number;
  quantity: number;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  notes?: string;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceiveItemDto {
  purchaseOrderItemId: number;
  quantityReceived: number;
  expiryDate: string;
  sellingPrice: number;
}
export interface ReceivePurchaseOrderDto {
  receivedDate: string;
  items: ReceiveItemDto[];
}

export const purchaseOrderApi = {
  create: async (data: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const res = await api.post('/purchase-orders', data);
    return res.data;
  },
  list: async (params?: { page?: number; limit?: number; status?: PurchaseOrderStatus; search?: string }): Promise<{ purchaseOrders: PurchaseOrder[]; total: number; page: number; limit: number }> => {
    const res = await api.get('/purchase-orders', { params });
    return res.data;
  },
  get: async (id: number): Promise<PurchaseOrder> => {
    const res = await api.get(`/purchase-orders/${id}`);
    return res.data;
  },
  receive: async (id: number, data: ReceivePurchaseOrderDto): Promise<PurchaseOrder> => {
    const res = await api.post(`/purchase-orders/${id}/receive`, data);
    return res.data;
  },
  updateStatus: async (id: number, status: PurchaseOrderStatus): Promise<PurchaseOrder> => {
    const res = await api.patch(`/purchase-orders/${id}/status`, { status });
    return res.data;
  },
};

// Inventory
export interface InventoryItem {
  id: number;
  medicineId: number;
  batchNumber: string;
  quantity: number;
  sellingPrice: number;
  expiryDate: string;
  supplierId?: number;
  purchaseDate: string;
  status: string;
  medicine?: { id: number; name: string };
}

export const inventoryApi = {
  list: async (params?: { page?: number; limit?: number }): Promise<{ inventory: InventoryItem[]; total: number; page: number; limit: number }> => {
    const res = await api.get('/inventory', { params });
    return res.data;
  },
  summary: async (): Promise<{ totalItems: number; totalValue: number; expiringItems: number; lowStockItems: number; activeItems: number }> => {
    const res = await api.get('/inventory/summary');
    return res.data;
  },
};

// Sales
export interface SaleItemDto { medicineId: number; quantity: number; unitPrice: number }
export interface CreateSaleDto {
  saleDate: string;
  customerName?: string;
  customerPhone?: string;
  discount?: number;
  tax?: number;
  items: SaleItemDto[];
}
export interface SaleItem { id: number; saleId: number; medicineId: number; quantity: number; unitPrice: number; totalPrice: number }
export interface Sale { id: number; saleNumber: string; saleDate: string; customerName?: string; customerPhone?: string; totalAmount: number; discount: number; tax: number; items: SaleItem[]; calculatedProfit?: number }

export const salesApi = {
  create: async (data: CreateSaleDto): Promise<Sale> => { const res = await api.post('/sales', data); return res.data },
  list: async (): Promise<Sale[]> => { const res = await api.get('/sales'); return res.data },
  reportDaily: async (params?: { start?: string; end?: string }): Promise<Array<{ day: string; total: string }>> => { const res = await api.get('/sales/reports/daily', { params }); return res.data },
  reportWeekly: async (params?: { start?: string; end?: string }): Promise<Array<{ week: string; total: string }>> => { const res = await api.get('/sales/reports/weekly', { params }); return res.data },
  reportMonthly: async (params?: { year?: number }): Promise<Array<{ month: string; total: string }>> => { const res = await api.get('/sales/reports/monthly', { params }); return res.data },
};

// Adjustments
export type AdjustmentType = 'damage' | 'theft' | 'expired' | 'correction' | 'return'
export interface CreateAdjustmentDto { inventoryId: number; adjustmentType: AdjustmentType; quantityChange: number; reason: string; adjustedBy?: number; notes?: string }
export interface StockAdjustment extends CreateAdjustmentDto { id: number; adjustmentDate: string }
export const adjustmentsApi = {
  create: async (data: CreateAdjustmentDto): Promise<StockAdjustment> => { const res = await api.post('/adjustments', data); return res.data },
  list: async (): Promise<StockAdjustment[]> => { const res = await api.get('/adjustments'); return res.data },
};

// Dashboard
export interface DashboardStats {
  totalMedicines: number;
  lowStockCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  totalSales: number;
  totalSalesAmount: number;
  currentMonthSales: {
    count: number;
    amount: number;
    sales: Sale[];
  };
  currentMonthProfit: number;
  totalProfit: number;
  lowStockMedicines: Medicine[];
  expiredMedicines: Medicine[];
  expiringSoonMedicines: Medicine[];
  recentSales: Sale[];
  topSellingMedicines: Array<{
    id: number;
    name: string;
    quantitySold: number;
    totalRevenue: number;
  }>;
  monthlySales: Array<{
    month: string;
    sales: number;
  }>;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => { const res = await api.get('/dashboard/stats'); return res.data },
};

export default api;

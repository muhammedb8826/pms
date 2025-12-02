export enum ReportPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export interface ReportQueryDto {
  period?: ReportPeriod;
  startDate?: string; // ISO date string (required if period is CUSTOM)
  endDate?: string; // ISO date string (required if period is CUSTOM)
  productId?: string; // Filter by product UUID
  categoryId?: string; // Filter by category UUID
  customerId?: string; // Filter by customer UUID
  supplierId?: string; // Filter by supplier UUID
  salespersonId?: string; // Filter by salesperson UUID
}

export interface PeriodInfo {
  startDate: string;
  endDate: string;
}

// Sales Report
export interface SalesReportSummary {
  totalSales: number;
  totalRevenue: number;
  totalPaid: number;
  totalCredit: number;
  averageSaleAmount: number;
  period: PeriodInfo;
}

export interface SalesByDay {
  date: string;
  count: number;
  revenue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  count: number;
  revenue: number;
}

export interface SalesReportSale {
  id: string;
  date: string;
  customer: string;
  salesperson?: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

export interface SalesReport {
  summary: SalesReportSummary;
  salesByDay: SalesByDay[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  sales: SalesReportSale[];
}

// Purchase Report
export interface PurchaseReportSummary {
  totalPurchases: number;
  totalAmount: number;
  totalPaid: number;
  totalCredit: number;
  averagePurchaseAmount: number;
  period: PeriodInfo;
}

export interface PurchasesByDay {
  date: string;
  count: number;
  amount: number;
}

export interface TopSupplier {
  supplierId: string;
  supplierName: string;
  count: number;
  amount: number;
}

export interface PurchaseReportPurchase {
  id: string;
  date: string;
  supplier: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

export interface PurchaseReport {
  summary: PurchaseReportSummary;
  purchasesByDay: PurchasesByDay[];
  topSuppliers: TopSupplier[];
  purchases: PurchaseReportPurchase[];
}

// Inventory Report
export interface InventoryReportSummary {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  expiredBatchesCount: number;
  expiringSoonCount: number;
}

export interface StockLevel {
  productId: string;
  productName: string;
  category: string;
  currentQuantity: number;
  minLevel: number;
  maxLevel: number;
  status: 'NORMAL' | 'LOW' | 'HIGH';
  batches: number;
}

export interface ExpiredBatch {
  id: string;
  batchNumber: string;
  productName: string;
  quantity: number;
  expiryDate: string;
  daysExpired: number;
}

export interface ExpiringBatch {
  id: string;
  batchNumber: string;
  productName: string;
  quantity: number;
  expiryDate: string;
  daysUntilExpiry: number;
}

export interface InventoryReport {
  summary: InventoryReportSummary;
  stockLevels: StockLevel[];
  lowStockItems: StockLevel[];
  expiredBatches: ExpiredBatch[];
  expiringSoon: ExpiringBatch[];
}

// Financial Report
export interface FinancialReportSummary {
  revenue: number;
  expenses: number;
  commissionExpenses: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  period: PeriodInfo;
}

export interface CashFlow {
  paymentsReceived: number;
  paymentsMade: number;
  netCashFlow: number;
}

export interface Outstanding {
  receivables: number;
  payables: number;
  netOutstanding: number;
}

export interface FinancialReport {
  summary: FinancialReportSummary;
  cashFlow: CashFlow;
  outstanding: Outstanding;
}

// Commission Report
export interface CommissionReportSummary {
  totalCommissions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  period: PeriodInfo;
}

export interface CommissionBySalesperson {
  salespersonId: string;
  salespersonName: string;
  count: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface CommissionReportCommission {
  id: string;
  salesperson: string;
  saleId: string;
  customer: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  paidDate: string | null;
}

export interface CommissionReport {
  summary: CommissionReportSummary;
  bySalesperson: CommissionBySalesperson[];
  commissions: CommissionReportCommission[];
}

// Product Performance Report
export interface ProductPerformanceSummary {
  totalProducts: number;
  totalQuantitySold: number;
  totalRevenue: number;
  period: PeriodInfo;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  category: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  currentStock: number;
  minLevel: number;
}

export interface ProductPerformanceReport {
  summary: ProductPerformanceSummary;
  products: ProductPerformance[];
}


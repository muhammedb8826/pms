export interface DashboardStats {
  totalRevenue: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
    footerText: string;
    footerSubtext: string;
  };
  totalSales: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
    footerText: string;
    footerSubtext: string;
  };
  totalPurchases: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
    footerText: string;
    footerSubtext: string;
  };
  lowStockItems: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
    footerText: string;
    footerSubtext: string;
  };
  pendingCredits?: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
    footerText: string;
    footerSubtext: string;
  };
  expiredBatches?: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
    footerText: string;
    footerSubtext: string;
  };
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface ChartConfig {
  [key: string]: {
    label: string;
    color?: string;
  };
}

export interface ChartResponse {
  chartData: ChartDataPoint[];
  config?: ChartConfig;
}

export interface TableDataItem {
  id: string | number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
  chartData?: ChartDataPoint[];
}

export interface PaginatedTableData {
  items: TableDataItem[];
  total: number;
  page: number;
  limit: number;
}


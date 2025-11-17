# Dashboard Data Preparation Guide for Backend

This guide explains how to prepare data for the Pharmacy Management System dashboard components: **Cards**, **Charts**, and **Tables**.

## Table of Contents

1. [Overview](#overview)
2. [Dashboard Statistics Cards](#dashboard-statistics-cards)
3. [Area Charts](#area-charts)
4. [Data Tables](#data-tables)
5. [API Endpoints](#api-endpoints)
6. [Response Format](#response-format)
7. [Example Implementations](#example-implementations)

---

## Overview

The dashboard displays three main components:
- **Statistics Cards**: Key metrics with trend indicators
- **Area Charts**: Time-series data visualization
- **Data Tables**: Detailed data with charts in expandable rows

All data should be returned in a consistent format that matches the frontend's expectations.

---

## Dashboard Statistics Cards

### Component: `SectionCards`

**Purpose**: Display key performance indicators (KPIs) with trend indicators.

### Data Structure

Each card requires:
- **Description**: Label for the metric (e.g., "Total Revenue", "New Customers")
- **Value**: The main number to display (formatted as currency, count, or percentage)
- **Trend**: Percentage change (positive or negative)
- **Trend Direction**: `up` or `down`
- **Footer Text**: Short description or context
- **Footer Subtext**: Additional context or time period

### API Endpoint

```http
GET /api/v1/dashboard/stats
Authorization: Bearer <access_token>
```

### Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "totalRevenue": {
      "value": 1250.00,
      "trend": 12.5,
      "trendDirection": "up",
      "footerText": "Trending up this month",
      "footerSubtext": "Revenue for the last 6 months"
    },
    "newCustomers": {
      "value": 1234,
      "trend": -20.0,
      "trendDirection": "down",
      "footerText": "Down 20% this period",
      "footerSubtext": "Acquisition needs attention"
    },
    "activeAccounts": {
      "value": 45678,
      "trend": 12.5,
      "trendDirection": "up",
      "footerText": "Strong user retention",
      "footerSubtext": "Engagement exceed targets"
    },
    "growthRate": {
      "value": 4.5,
      "trend": 4.5,
      "trendDirection": "up",
      "footerText": "Steady performance increase",
      "footerSubtext": "Meets growth projections"
    }
  },
  "timestamp": "2025-11-18T00:00:00.000Z"
}
```

### Pharmacy-Specific Metrics

For a pharmacy management system, consider these metrics:

```typescript
interface DashboardStats {
  totalRevenue: {
    value: number;           // Total sales revenue
    trend: number;           // Percentage change
    trendDirection: "up" | "down";
    footerText: string;
    footerSubtext: string;
  };
  totalSales: {
    value: number;           // Number of sales transactions
    trend: number;
    trendDirection: "up" | "down";
    footerText: string;
    footerSubtext: string;
  };
  totalPurchases: {
    value: number;           // Number of purchase orders
    trend: number;
    trendDirection: "up" | "down";
    footerText: string;
    footerSubtext: string;
  };
  lowStockItems: {
    value: number;           // Products below minimum stock
    trend: number;
    trendDirection: "up" | "down";
    footerText: string;
    footerSubtext: string;
  };
  pendingCredits: {
    value: number;           // Total pending credits (payable + receivable)
    trend: number;
    trendDirection: "up" | "down";
    footerText: string;
    footerSubtext: string;
  };
  expiredBatches: {
    value: number;           // Batches expiring soon or expired
    trend: number;
    trendDirection: "up" | "down";
    footerText: string;
    footerSubtext: string;
  };
}
```

### Calculation Guidelines

**Trend Calculation**:
```typescript
// Compare current period vs previous period
const currentPeriod = getCurrentPeriodValue();
const previousPeriod = getPreviousPeriodValue();
const trend = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
const trendDirection = trend >= 0 ? "up" : "down";
```

**Time Periods**:
- **Daily**: Compare today vs yesterday
- **Weekly**: Compare this week vs last week
- **Monthly**: Compare this month vs last month
- **Yearly**: Compare this year vs last year

---

## Area Charts

### Component: `ChartAreaInteractive`

**Purpose**: Display time-series data with multiple data series (stacked area chart).

### Data Structure

Each data point requires:
- **date**: ISO 8601 date string (YYYY-MM-DD)
- **Series values**: Numeric values for each series (e.g., `desktop`, `mobile`, `sales`, `purchases`)

### API Endpoint

```http
GET /api/v1/dashboard/charts/sales?timeRange=90d
GET /api/v1/dashboard/charts/revenue?timeRange=30d
GET /api/v1/dashboard/charts/purchases?timeRange=7d
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `timeRange`: `7d` (7 days), `30d` (30 days), `90d` (90 days)

### Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "chartData": [
      {
        "date": "2024-04-01",
        "sales": 222,
        "purchases": 150
      },
      {
        "date": "2024-04-02",
        "sales": 97,
        "purchases": 180
      },
      {
        "date": "2024-04-03",
        "sales": 167,
        "purchases": 120
      }
      // ... more data points
    ],
    "config": {
      "sales": {
        "label": "Sales",
        "color": "var(--primary)"
      },
      "purchases": {
        "label": "Purchases",
        "color": "var(--primary)"
      }
    }
  },
  "timestamp": "2025-11-18T00:00:00.000Z"
}
```

### Pharmacy-Specific Chart Data

**Sales vs Purchases Chart**:
```json
{
  "chartData": [
    {
      "date": "2025-11-01",
      "sales": 15000.00,
      "purchases": 8000.00
    },
    {
      "date": "2025-11-02",
      "sales": 18000.00,
      "purchases": 12000.00
    }
  ]
}
```

**Revenue by Payment Method**:
```json
{
  "chartData": [
    {
      "date": "2025-11-01",
      "cash": 5000.00,
      "card": 8000.00,
      "mobileMoney": 2000.00
    }
  ]
}
```

**Product Categories Performance**:
```json
{
  "chartData": [
    {
      "date": "2025-11-01",
      "prescription": 10000.00,
      "otc": 5000.00,
      "supplements": 3000.00
    }
  ]
}
```

### Data Requirements

1. **Date Range**: Return data for the requested time range (7d, 30d, 90d)
2. **Daily Granularity**: One data point per day
3. **Complete Series**: Ensure all dates in the range have data (use 0 for missing days)
4. **Sorted by Date**: Data should be sorted chronologically (oldest to newest)

### Backend Implementation Example

```typescript
// Calculate daily sales and purchases for the last 90 days
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 90);

const chartData = [];
for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
  const dateStr = d.toISOString().split('T')[0];
  const sales = await getDailySalesTotal(dateStr);
  const purchases = await getDailyPurchasesTotal(dateStr);
  
  chartData.push({
    date: dateStr,
    sales: sales || 0,
    purchases: purchases || 0
  });
}

return {
  success: true,
  data: { chartData },
  timestamp: new Date().toISOString()
};
```

---

## Data Tables

### Component: `DataTable`

**Purpose**: Display detailed data in a sortable, filterable table with expandable rows showing charts.

### Data Structure

Each row requires:
- **id**: Unique identifier
- **header**: Main title/name
- **type**: Category or type
- **status**: Current status
- **target**: Target value (numeric or string)
- **limit**: Limit/threshold value
- **reviewer**: Assigned person or entity
- **chartData**: Time-series data for the expandable chart (optional)

### API Endpoint

```http
GET /api/v1/dashboard/table-data?page=1&limit=10&sortBy=header&sortOrder=ASC
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Field to sort by (`header`, `type`, `status`, `target`, `limit`)
- `sortOrder`: `ASC` or `DESC`

### Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "header": "Top Selling Products",
        "type": "Product",
        "status": "Active",
        "target": "1000",
        "limit": "500",
        "reviewer": "Pharmacy Manager",
        "chartData": [
          { "month": "January", "sales": 800, "purchases": 600 },
          { "month": "February", "sales": 950, "purchases": 700 },
          { "month": "March", "sales": 1100, "purchases": 800 }
        ]
      },
      {
        "id": 2,
        "header": "Low Stock Alerts",
        "type": "Inventory",
        "status": "Warning",
        "target": "50",
        "limit": "20",
        "reviewer": "Inventory Controller"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  },
  "timestamp": "2025-11-18T00:00:00.000Z"
}
```

### Pharmacy-Specific Table Data

**Top Products by Sales**:
```json
{
  "items": [
    {
      "id": "product-uuid-1",
      "header": "Paracetamol 500mg",
      "type": "Prescription",
      "status": "In Stock",
      "target": "1000",
      "limit": "500",
      "reviewer": "Pharmacist",
      "chartData": [
        { "month": "Sep", "sales": 800, "stock": 600 },
        { "month": "Oct", "sales": 950, "stock": 700 },
        { "month": "Nov", "sales": 1100, "stock": 800 }
      ]
    }
  ]
}
```

**Expiring Batches**:
```json
{
  "items": [
    {
      "id": "batch-uuid-1",
      "header": "Batch #BATCH-001 - Amoxicillin",
      "type": "Batch",
      "status": "Expiring Soon",
      "target": "2025-12-31",
      "limit": "30",
      "reviewer": "Store Manager",
      "chartData": [
        { "month": "Sep", "quantity": 500, "sold": 200 },
        { "month": "Oct", "quantity": 300, "sold": 150 },
        { "month": "Nov", "quantity": 150, "sold": 100 }
      ]
    }
  ]
}
```

**Pending Credits**:
```json
{
  "items": [
    {
      "id": "credit-uuid-1",
      "header": "Supplier Payment - ABC Pharma",
      "type": "Payable",
      "status": "Pending",
      "target": "5000.00",
      "limit": "3000.00",
      "reviewer": "Finance Officer",
      "chartData": [
        { "month": "Sep", "total": 5000, "paid": 2000 },
        { "month": "Oct", "total": 5000, "paid": 2500 },
        { "month": "Nov", "total": 5000, "paid": 3000 }
      ]
    }
  ]
}
```

### Chart Data for Table Rows

When a row is expanded, it shows a chart. The `chartData` should include:
- **X-axis labels**: Month names (abbreviated: "Jan", "Feb", "Mar") or dates
- **Y-axis values**: Numeric values for each series
- **Multiple series**: Support for 2-3 data series (e.g., `sales` and `purchases`, `quantity` and `sold`)

---

## API Endpoints Summary

### 1. Dashboard Statistics

```http
GET /api/v1/dashboard/stats
```

**Response**: Statistics for cards (revenue, sales, purchases, etc.)

### 2. Chart Data

```http
GET /api/v1/dashboard/charts/{chartType}?timeRange={range}
```

**Chart Types**:
- `sales` - Sales over time
- `purchases` - Purchases over time
- `revenue` - Revenue over time
- `products` - Product performance
- `credits` - Credit trends

**Time Ranges**: `7d`, `30d`, `90d`

### 3. Table Data

```http
GET /api/v1/dashboard/table-data?page=1&limit=10&sortBy=header&sortOrder=ASC
```

**Response**: Paginated table data with optional chart data

---

## Response Format Standard

All dashboard endpoints should follow this format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Endpoint-specific data
  },
  "timestamp": "2025-11-18T00:00:00.000Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error message or array of validation errors",
  "error": {
    "code": "ERROR_CODE",
    "details": "Error details"
  },
  "timestamp": "2025-11-18T00:00:00.000Z",
  "path": "/api/v1/dashboard/stats"
}
```

---

## Example Implementations

### Example 1: Dashboard Stats Endpoint

```typescript
// GET /api/v1/dashboard/stats
async function getDashboardStats() {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  // Calculate current period values
  const currentRevenue = await getTotalRevenue(today);
  const currentSales = await getTotalSales(today);
  const currentPurchases = await getTotalPurchases(today);
  const currentLowStock = await getLowStockItemsCount();
  
  // Calculate previous period values
  const previousRevenue = await getTotalRevenue(lastMonth);
  const previousSales = await getTotalSales(lastMonth);
  const previousPurchases = await getTotalPurchases(lastMonth);
  const previousLowStock = await getLowStockItemsCount(lastMonth);
  
  // Calculate trends
  const revenueTrend = calculateTrend(currentRevenue, previousRevenue);
  const salesTrend = calculateTrend(currentSales, previousSales);
  const purchasesTrend = calculateTrend(currentPurchases, previousPurchases);
  const lowStockTrend = calculateTrend(currentLowStock, previousLowStock);
  
  return {
    success: true,
    message: "Operation completed successfully",
    data: {
      totalRevenue: {
        value: currentRevenue,
        trend: revenueTrend.percentage,
        trendDirection: revenueTrend.direction,
        footerText: revenueTrend.direction === "up" 
          ? "Trending up this month" 
          : "Down this month",
        footerSubtext: "Revenue for the last 6 months"
      },
      totalSales: {
        value: currentSales,
        trend: salesTrend.percentage,
        trendDirection: salesTrend.direction,
        footerText: salesTrend.direction === "up"
          ? "Sales increasing"
          : "Sales decreasing",
        footerSubtext: "Transaction count"
      },
      totalPurchases: {
        value: currentPurchases,
        trend: purchasesTrend.percentage,
        trendDirection: purchasesTrend.direction,
        footerText: purchasesTrend.direction === "up"
          ? "Purchase orders increasing"
          : "Purchase orders decreasing",
        footerSubtext: "Purchase order count"
      },
      lowStockItems: {
        value: currentLowStock,
        trend: lowStockTrend.percentage,
        trendDirection: lowStockTrend.direction,
        footerText: lowStockTrend.direction === "up"
          ? "More items need restocking"
          : "Stock levels improving",
        footerSubtext: "Items below minimum stock"
      }
    },
    timestamp: new Date().toISOString()
  };
}

function calculateTrend(current: number, previous: number) {
  if (previous === 0) {
    return { percentage: current > 0 ? 100 : 0, direction: current > 0 ? "up" : "down" };
  }
  const percentage = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(percentage),
    direction: percentage >= 0 ? "up" : "down"
  };
}
```

### Example 2: Chart Data Endpoint

```typescript
// GET /api/v1/dashboard/charts/sales?timeRange=90d
async function getSalesChartData(timeRange: string) {
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const chartData = [];
  
  // Generate data for each day
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    // Get daily totals
    const sales = await getDailySalesTotal(dateStr);
    const purchases = await getDailyPurchasesTotal(dateStr);
    
    chartData.push({
      date: dateStr,
      sales: sales || 0,
      purchases: purchases || 0
    });
  }
  
  return {
    success: true,
    message: "Operation completed successfully",
    data: {
      chartData,
      config: {
        sales: {
          label: "Sales",
          color: "var(--primary)"
        },
        purchases: {
          label: "Purchases",
          color: "var(--primary)"
        }
      }
    },
    timestamp: new Date().toISOString()
  };
}
```

### Example 3: Table Data Endpoint

```typescript
// GET /api/v1/dashboard/table-data
async function getTableData(page: number, limit: number, sortBy: string, sortOrder: string) {
  // Get top products by sales
  const products = await getTopProductsBySales(page, limit, sortBy, sortOrder);
  
  const items = await Promise.all(products.map(async (product) => {
    // Get chart data for last 6 months
    const chartData = await getProductSalesChartData(product.id, 6);
    
    return {
      id: product.id,
      header: product.name,
      type: product.category?.name || "Product",
      status: product.stockQuantity > 0 ? "In Stock" : "Out of Stock",
      target: product.totalSales?.toString() || "0",
      limit: product.stockQuantity?.toString() || "0",
      reviewer: "Pharmacy Manager",
      chartData: chartData.map(item => ({
        month: item.month,
        sales: item.sales,
        stock: item.stock
      }))
    };
  }));
  
  return {
    success: true,
    message: "Operation completed successfully",
    data: {
      items,
      total: await getTotalProductsCount(),
      page,
      limit
    },
    timestamp: new Date().toISOString()
  };
}
```

---

## Data Formatting Guidelines

### Numbers
- **Currency**: Return as numbers (frontend will format)
- **Percentages**: Return as numbers (e.g., 12.5 for 12.5%)
- **Counts**: Return as integers

### Dates
- **Format**: ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
- **Chart dates**: Use YYYY-MM-DD format
- **Time ranges**: Always use UTC or consistent timezone

### Missing Data
- Use `0` for missing numeric values in time series
- Use `null` for optional fields
- Ensure all dates in a range have entries (fill with 0 if no data)

---

## Performance Considerations

1. **Caching**: Cache dashboard stats for 5-15 minutes (they don't need real-time updates)
2. **Pagination**: Always paginate table data
3. **Date Range Limits**: Limit chart data to reasonable ranges (max 365 days)
4. **Aggregation**: Pre-aggregate data at the database level when possible
5. **Indexing**: Ensure proper database indexes on date fields and foreign keys

---

## Testing Checklist

- [ ] Stats endpoint returns all required fields
- [ ] Trend calculations are correct (positive/negative)
- [ ] Chart data includes all dates in the requested range
- [ ] Table data is paginated correctly
- [ ] Sorting works for all sortable fields
- [ ] Chart data in table rows is properly formatted
- [ ] Missing data is handled gracefully (0 values, nulls)
- [ ] Date formats are consistent (ISO 8601)
- [ ] Response follows standard format with `success`, `data`, `timestamp`

---

## Summary

The dashboard requires three main data endpoints:

1. **`GET /api/v1/dashboard/stats`** - Statistics for cards
2. **`GET /api/v1/dashboard/charts/{type}?timeRange={range}`** - Time-series chart data
3. **`GET /api/v1/dashboard/table-data`** - Paginated table data with optional chart data

All endpoints should:
- Return data in the standard response format
- Handle missing data gracefully
- Support pagination where applicable
- Include proper error handling
- Use consistent date formats (ISO 8601)

This guide ensures the backend provides data in the exact format the frontend dashboard components expect.


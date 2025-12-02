"use client";

import React, { useMemo, useState } from "react";
import {
  IconChartBar,
  IconCurrencyDollar,
  IconPackage,
  IconShoppingCart,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useSalesReport,
  usePurchaseReport,
  useInventoryReport,
  useFinancialReport,
  useCommissionReport,
  useProductPerformanceReport,
} from "@/features/report/hooks/useReports";
import { ReportPeriod } from "@/features/report/types";
import type { ReportQueryDto } from "@/features/report/types";
import { useAllCustomers } from "@/features/customer/hooks/useCustomers";
import { useAllSuppliers } from "@/features/supplier/hooks/useSuppliers";
import { useAllUsers } from "@/features/user/hooks/useUsers";
import { useAllCategories } from "@/features/category/hooks/useCategories";
import { useAllProducts } from "@/features/product/hooks/useProducts";
import type { Customer } from "@/features/customer/types";
import type { Supplier } from "@/features/supplier/types";
import type { User } from "@/features/user/types";
import type { Category } from "@/features/category/types";
import type { Product } from "@/features/product/types";
import { handleApiError } from "@/lib/utils/api-error-handler";

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [period, setPeriod] = useState<ReportPeriod>(ReportPeriod.MONTH);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filters, setFilters] = useState<{
    customerId?: string;
    supplierId?: string;
    salespersonId?: string;
    categoryId?: string;
    productId?: string;
  }>({});

  // Get filter options
  const allCustomersQuery = useAllCustomers();
  const allSuppliersQuery = useAllSuppliers();
  const allUsersQuery = useAllUsers();
  const allCategoriesQuery = useAllCategories();
  const allProductsQuery = useAllProducts();

  const customers = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allCustomersQuery.data as Customer[] | WR<Customer[]> | undefined;
    if (!data) return [] as Customer[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Customer[];
  }, [allCustomersQuery.data]);

  const suppliers = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allSuppliersQuery.data as Supplier[] | WR<Supplier[]> | undefined;
    if (!data) return [] as Supplier[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Supplier[];
  }, [allSuppliersQuery.data]);

  const salespeople = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allUsersQuery.data as User[] | WR<User[]> | undefined;
    if (!data) return [] as User[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as User[];
  }, [allUsersQuery.data]);

  const categories = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allCategoriesQuery.data as Category[] | WR<Category[]> | undefined;
    if (!data) return [] as Category[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Category[];
  }, [allCategoriesQuery.data]);

  const products = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allProductsQuery.data as Product[] | WR<Product[]> | undefined;
    if (!data) return [] as Product[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Product[];
  }, [allProductsQuery.data]);

  // Build query params
  const queryParams = useMemo<ReportQueryDto>(() => {
    const params: ReportQueryDto = {
      period: period === ReportPeriod.CUSTOM ? ReportPeriod.CUSTOM : period,
    };
    if (period === ReportPeriod.CUSTOM) {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    }
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.supplierId) params.supplierId = filters.supplierId;
    if (filters.salespersonId) params.salespersonId = filters.salespersonId;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.productId) params.productId = filters.productId;
    return params;
  }, [period, startDate, endDate, filters]);

  // Fetch reports
  const salesReport = useSalesReport(activeTab === "sales" ? queryParams : undefined);
  const purchaseReport = usePurchaseReport(activeTab === "purchases" ? queryParams : undefined);
  const inventoryReport = useInventoryReport();
  const financialReport = useFinancialReport(
    activeTab === "financial" ? { period: queryParams.period, startDate: queryParams.startDate, endDate: queryParams.endDate } : undefined
  );
  const commissionReport = useCommissionReport(
    activeTab === "commissions" ? queryParams : undefined
  );
  const productReport = useProductPerformanceReport(
    activeTab === "products" ? queryParams : undefined
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "__all__" ? undefined : value,
    }));
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-x-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive analytics and insights across your business
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">
            <IconShoppingCart className="mr-2 size-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="purchases">
            <IconPackage className="mr-2 size-4" />
            Purchases
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <IconChartBar className="mr-2 size-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="financial">
            <IconCurrencyDollar className="mr-2 size-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <IconUsers className="mr-2 size-4" />
            Commissions
          </TabsTrigger>
          <TabsTrigger value="products">
            <IconTrendingUp className="mr-2 size-4" />
            Products
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 rounded-lg border bg-card p-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ReportPeriod.DAY}>Today</SelectItem>
              <SelectItem value={ReportPeriod.WEEK}>This Week</SelectItem>
              <SelectItem value={ReportPeriod.MONTH}>This Month</SelectItem>
              <SelectItem value={ReportPeriod.YEAR}>This Year</SelectItem>
              <SelectItem value={ReportPeriod.CUSTOM}>Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {period === ReportPeriod.CUSTOM && (
            <>
              <Input
                type="date"
                placeholder="Start date"
                className="w-full sm:w-40"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                placeholder="End date"
                className="w-full sm:w-40"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}
          {activeTab === "sales" && (
            <>
              <Select
                value={filters.customerId || "__all__"}
                onValueChange={(v) => handleFilterChange("customerId", v)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Customers</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.salespersonId || "__all__"}
                onValueChange={(v) => handleFilterChange("salespersonId", v)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Salespeople" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Salespeople</SelectItem>
                  {salespeople.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          {activeTab === "purchases" && (
            <Select
              value={filters.supplierId || "__all__"}
              onValueChange={(v) => handleFilterChange("supplierId", v)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {(activeTab === "sales" || activeTab === "purchases" || activeTab === "products") && (
            <>
              <Select
                value={filters.categoryId || "__all__"}
                onValueChange={(v) => handleFilterChange("categoryId", v)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.productId || "__all__"}
                onValueChange={(v) => handleFilterChange("productId", v)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          {activeTab === "commissions" && (
            <Select
              value={filters.salespersonId || "__all__"}
              onValueChange={(v) => handleFilterChange("salespersonId", v)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Salespeople" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Salespeople</SelectItem>
                {salespeople.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-4">
          {salesReport.loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">Loading sales report...</p>
            </div>
          ) : salesReport.error ? (
            <div className="p-4 text-sm text-destructive">
              {handleApiError(salesReport.error, { defaultMessage: "Failed to load sales report", showToast: false })}
            </div>
          ) : salesReport.report ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Sales</CardDescription>
                    <CardTitle className="text-2xl">{salesReport.report.summary.totalSales}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(salesReport.report.summary.totalRevenue)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Paid</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(salesReport.report.summary.totalPaid)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Average Sale</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(salesReport.report.summary.averageSaleAmount)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {salesReport.report.topProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesReport.report.topProducts.map((product) => (
                          <TableRow key={product.productId}>
                            <TableCell className="font-medium">{product.productName}</TableCell>
                            <TableCell className="text-right tabular-nums">{product.quantity}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {currencyFormatter.format(product.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {salesReport.report.topCustomers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Sales Count</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesReport.report.topCustomers.map((customer) => (
                          <TableRow key={customer.customerId}>
                            <TableCell className="font-medium">{customer.customerName}</TableCell>
                            <TableCell className="text-right tabular-nums">{customer.count}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {currencyFormatter.format(customer.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No data available</div>
          )}
        </TabsContent>

        {/* Purchase Report */}
        <TabsContent value="purchases" className="space-y-4">
          {purchaseReport.loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">Loading purchase report...</p>
            </div>
          ) : purchaseReport.error ? (
            <div className="p-4 text-sm text-destructive">
              {handleApiError(purchaseReport.error, { defaultMessage: "Failed to load purchase report", showToast: false })}
            </div>
          ) : purchaseReport.report ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Purchases</CardDescription>
                    <CardTitle className="text-2xl">{purchaseReport.report.summary.totalPurchases}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Amount</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(purchaseReport.report.summary.totalAmount)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Paid</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(purchaseReport.report.summary.totalPaid)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Average Purchase</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(purchaseReport.report.summary.averagePurchaseAmount)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {purchaseReport.report.topSuppliers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Suppliers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Purchase Count</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseReport.report.topSuppliers.map((supplier) => (
                          <TableRow key={supplier.supplierId}>
                            <TableCell className="font-medium">{supplier.supplierName}</TableCell>
                            <TableCell className="text-right tabular-nums">{supplier.count}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {currencyFormatter.format(supplier.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No data available</div>
          )}
        </TabsContent>

        {/* Inventory Report */}
        <TabsContent value="inventory" className="space-y-4">
          {inventoryReport.loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">Loading inventory report...</p>
            </div>
          ) : inventoryReport.error ? (
            <div className="p-4 text-sm text-destructive">
              {handleApiError(inventoryReport.error, { defaultMessage: "Failed to load inventory report", showToast: false })}
            </div>
          ) : inventoryReport.report ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Products</CardDescription>
                    <CardTitle className="text-2xl">{inventoryReport.report.summary.totalProducts}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Value</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(inventoryReport.report.summary.totalValue)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Low Stock</CardDescription>
                    <CardTitle className="text-2xl text-orange-600">
                      {inventoryReport.report.summary.lowStockCount}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Expired</CardDescription>
                    <CardTitle className="text-2xl text-destructive">
                      {inventoryReport.report.summary.expiredBatchesCount}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Expiring Soon</CardDescription>
                    <CardTitle className="text-2xl text-yellow-600">
                      {inventoryReport.report.summary.expiringSoonCount}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {inventoryReport.report.lowStockItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Low Stock Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Current Qty</TableHead>
                          <TableHead className="text-right">Min Level</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryReport.report.lowStockItems.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right tabular-nums">{item.currentQuantity}</TableCell>
                            <TableCell className="text-right tabular-nums">{item.minLevel}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === "LOW" ? "destructive" : "secondary"}>
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {inventoryReport.report.expiredBatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Expired Batches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead className="text-right">Days Expired</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryReport.report.expiredBatches.map((batch) => (
                          <TableRow key={batch.id}>
                            <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                            <TableCell>{batch.productName}</TableCell>
                            <TableCell className="text-right tabular-nums">{batch.quantity}</TableCell>
                            <TableCell>{dateFormatter.format(new Date(batch.expiryDate))}</TableCell>
                            <TableCell className="text-right tabular-nums text-destructive">
                              {batch.daysExpired}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {inventoryReport.report.expiringSoon.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Expiring Soon (within 30 days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead className="text-right">Days Until Expiry</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryReport.report.expiringSoon.map((batch) => (
                          <TableRow key={batch.id}>
                            <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                            <TableCell>{batch.productName}</TableCell>
                            <TableCell className="text-right tabular-nums">{batch.quantity}</TableCell>
                            <TableCell>{dateFormatter.format(new Date(batch.expiryDate))}</TableCell>
                            <TableCell className="text-right tabular-nums text-yellow-600">
                              {batch.daysUntilExpiry}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No data available</div>
          )}
        </TabsContent>

        {/* Financial Report */}
        <TabsContent value="financial" className="space-y-4">
          {financialReport.loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">Loading financial report...</p>
            </div>
          ) : financialReport.error ? (
            <div className="p-4 text-sm text-destructive">
              {handleApiError(financialReport.error, { defaultMessage: "Failed to load financial report", showToast: false })}
            </div>
          ) : financialReport.report ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Revenue</CardDescription>
                    <CardTitle className="text-2xl text-green-600">
                      {currencyFormatter.format(financialReport.report.summary.revenue)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Expenses</CardDescription>
                    <CardTitle className="text-2xl text-red-600">
                      {currencyFormatter.format(financialReport.report.summary.totalExpenses)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Profit</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(financialReport.report.summary.profit)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Profit Margin</CardDescription>
                    <CardTitle className="text-2xl">
                      {financialReport.report.summary.profitMargin.toFixed(2)}%
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cash Flow</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payments Received</span>
                      <span className="text-sm font-medium text-green-600 tabular-nums">
                        {currencyFormatter.format(financialReport.report.cashFlow.paymentsReceived)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payments Made</span>
                      <span className="text-sm font-medium text-red-600 tabular-nums">
                        {currencyFormatter.format(financialReport.report.cashFlow.paymentsMade)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Net Cash Flow</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {currencyFormatter.format(financialReport.report.cashFlow.netCashFlow)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Receivables</span>
                      <span className="text-sm font-medium tabular-nums">
                        {currencyFormatter.format(financialReport.report.outstanding.receivables)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payables</span>
                      <span className="text-sm font-medium tabular-nums">
                        {currencyFormatter.format(financialReport.report.outstanding.payables)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Net Outstanding</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {currencyFormatter.format(financialReport.report.outstanding.netOutstanding)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No data available</div>
          )}
        </TabsContent>

        {/* Commission Report */}
        <TabsContent value="commissions" className="space-y-4">
          {commissionReport.loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">Loading commission report...</p>
            </div>
          ) : commissionReport.error ? (
            <div className="p-4 text-sm text-destructive">
              {handleApiError(commissionReport.error, { defaultMessage: "Failed to load commission report", showToast: false })}
            </div>
          ) : commissionReport.report ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Commissions</CardDescription>
                    <CardTitle className="text-2xl">{commissionReport.report.summary.totalCommissions}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Amount</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(commissionReport.report.summary.totalAmount)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Paid</CardDescription>
                    <CardTitle className="text-2xl text-green-600">
                      {currencyFormatter.format(commissionReport.report.summary.paidAmount)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pending</CardDescription>
                    <CardTitle className="text-2xl text-orange-600">
                      {currencyFormatter.format(commissionReport.report.summary.pendingAmount)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {commissionReport.report.bySalesperson.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>By Salesperson</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Salesperson</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Pending</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissionReport.report.bySalesperson.map((sp) => (
                          <TableRow key={sp.salespersonId}>
                            <TableCell className="font-medium">{sp.salespersonName}</TableCell>
                            <TableCell className="text-right tabular-nums">{sp.count}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {currencyFormatter.format(sp.totalAmount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-green-600">
                              {currencyFormatter.format(sp.paidAmount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-orange-600">
                              {currencyFormatter.format(sp.pendingAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No data available</div>
          )}
        </TabsContent>

        {/* Product Performance Report */}
        <TabsContent value="products" className="space-y-4">
          {productReport.loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">Loading product performance report...</p>
            </div>
          ) : productReport.error ? (
            <div className="p-4 text-sm text-destructive">
              {handleApiError(productReport.error, { defaultMessage: "Failed to load product performance report", showToast: false })}
            </div>
          ) : productReport.report ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Products</CardDescription>
                    <CardTitle className="text-2xl">{productReport.report.summary.totalProducts}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Quantity Sold</CardDescription>
                    <CardTitle className="text-2xl">{productReport.report.summary.totalQuantitySold}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-2xl">
                      {currencyFormatter.format(productReport.report.summary.totalRevenue)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {productReport.report.products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Product Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Qty Sold</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="text-right">Avg Price</TableHead>
                            <TableHead className="text-right">Current Stock</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productReport.report.products.map((product) => (
                            <TableRow key={product.productId}>
                              <TableCell className="font-medium">{product.productName}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell className="text-right tabular-nums">{product.totalQuantitySold}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {currencyFormatter.format(product.totalRevenue)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {currencyFormatter.format(product.averagePrice)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {product.currentStock}
                                {product.currentStock <= product.minLevel && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    LOW
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No data available</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

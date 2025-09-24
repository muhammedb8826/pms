"use client";

import { useEffect, useState } from "react";
import { dashboardApi, DashboardStats, Sale } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [allSalesPage, setAllSalesPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB'
      }).format(0);
    }
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ET');
  };

  const getStockStatus = (quantity: number, lowStockThreshold: number = 10) => {
    if (quantity === 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= lowStockThreshold) return { status: 'Low Stock', variant: 'secondary' as const };
    return { status: 'In Stock', variant: 'default' as const };
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'Expired', variant: 'destructive' as const };
    if (daysUntilExpiry <= 30) return { status: 'Expiring Soon', variant: 'secondary' as const };
    return { status: 'Good', variant: 'default' as const };
  };

  const getCurrentPageItems = <T,>(items: T[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (items: any[]) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading dashboard...</div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">Failed to load dashboard data</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString('en-ET')}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Medicines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMedicines || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total medicines in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Medicines below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiredCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Expired medicines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentMonthSales?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(stats.currentMonthSales?.amount)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(stats.totalSalesAmount)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(stats.currentMonthProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Current month profit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              All time profit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {stats.monthlySales && stats.monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPrice(Number(value))} />
                  <Bar dataKey="sales" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No sales data available for chart
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Best Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Quantity Sold</TableHead>
                <TableHead>Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentPageItems(stats.topSellingMedicines || [], currentPage).map((medicine, index) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">{medicine.name}</TableCell>
                  <TableCell>{medicine.quantitySold}</TableCell>
                  <TableCell>{formatPrice(medicine.totalRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {getTotalPages(stats.topSellingMedicines || []) > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {currentPage} of {getTotalPages(stats.topSellingMedicines || [])}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(getTotalPages(stats.topSellingMedicines || []), prev + 1))}
                disabled={currentPage === getTotalPages(stats.topSellingMedicines || [])}
                className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Month Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Current Month Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentPageItems(stats.currentMonthSales?.sales || [], salesPage).map((sale: Sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                  <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                  <TableCell>{formatDate(sale.saleDate)}</TableCell>
                  <TableCell>{formatPrice(Number(sale.totalAmount))}</TableCell>
                  <TableCell>{formatPrice(sale.calculatedProfit || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {getTotalPages(stats.currentMonthSales?.sales || []) > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setSalesPage(prev => Math.max(1, prev - 1))}
                disabled={salesPage === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {salesPage} of {getTotalPages(stats.currentMonthSales?.sales || [])}
              </span>
              <button
                onClick={() => setSalesPage(prev => Math.min(getTotalPages(stats.currentMonthSales?.sales || []), prev + 1))}
                disabled={salesPage === getTotalPages(stats.currentMonthSales?.sales || [])}
                className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Sales */}
      <Card>
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentPageItems(stats.recentSales || [], allSalesPage).map((sale: Sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                  <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                  <TableCell>{formatDate(sale.saleDate)}</TableCell>
                  <TableCell>{formatPrice(Number(sale.totalAmount))}</TableCell>
                  <TableCell>{formatPrice(sale.calculatedProfit || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {getTotalPages(stats.recentSales || []) > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setAllSalesPage(prev => Math.max(1, prev - 1))}
                disabled={allSalesPage === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {allSalesPage} of {getTotalPages(stats.recentSales || [])}
              </span>
              <button
                onClick={() => setAllSalesPage(prev => Math.min(getTotalPages(stats.recentSales || []), prev + 1))}
                disabled={allSalesPage === getTotalPages(stats.recentSales || [])}
                className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

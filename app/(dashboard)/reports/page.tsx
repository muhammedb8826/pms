"use client";

import { useEffect, useState, useCallback } from "react";
import { salesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const [dailySales, setDailySales] = useState<Array<{ day: string; total: string }>>([]);
  const [weeklySales, setWeeklySales] = useState<Array<{ week: string; total: string }>>([]);
  const [monthlySales, setMonthlySales] = useState<Array<{ month: string; total: string }>>([]);

  const loadDailySales = useCallback(async () => {
    setLoading(true);
    try {
      const response = await salesApi.reportDaily({
        start: dateRange.start,
        end: dateRange.end
      });
      setDailySales(response);
    } catch (error) {
      console.error("Failed to load daily sales:", error);
      toast.error("Failed to load daily sales");
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  const loadWeeklySales = useCallback(async () => {
    setLoading(true);
    try {
      const response = await salesApi.reportWeekly({
        start: dateRange.start,
        end: dateRange.end
      });
      setWeeklySales(response);
    } catch (error) {
      console.error("Failed to load weekly sales:", error);
      toast.error("Failed to load weekly sales");
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  const loadMonthlySales = useCallback(async () => {
    setLoading(true);
    try {
      const response = await salesApi.reportMonthly({ year });
      setMonthlySales(response);
    } catch (error) {
      console.error("Failed to load monthly sales:", error);
      toast.error("Failed to load monthly sales");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    if (reportType === "daily") {
      loadDailySales();
    } else if (reportType === "weekly") {
      loadWeeklySales();
    } else {
      loadMonthlySales();
    }
  }, [reportType, loadDailySales, loadWeeklySales, loadMonthlySales]);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(numPrice);
  };

  const getTotalSales = (data: Array<{ total: string }>) => {
    return data.reduce((sum, item) => sum + parseFloat(item.total), 0);
  };

  const getAverageSales = (data: Array<{ total: string }>) => {
    if (data.length === 0) return 0;
    return getTotalSales(data) / data.length;
  };

  const currentData = reportType === "daily" ? dailySales : reportType === "weekly" ? weeklySales : monthlySales;
  const totalSales = getTotalSales(currentData);
  const averageSales = getAverageSales(currentData);

  const chartData = currentData.map(item => ({
    period: reportType === "daily" 
      ? (item as { day: string; total: string }).day 
      : reportType === "weekly"
      ? (item as { week: string; total: string }).week
      : (item as { month: string; total: string }).month,
    sales: parseFloat(item.total)
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Report Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Sales</SelectItem>
                  <SelectItem value="weekly">Weekly Sales</SelectItem>
                  <SelectItem value="monthly">Monthly Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === "daily" || reportType === "weekly" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button onClick={
                reportType === "daily" 
                  ? loadDailySales 
                  : reportType === "weekly" 
                  ? loadWeeklySales 
                  : loadMonthlySales
              } disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              {reportType === "daily" ? "Selected date range" : reportType === "weekly" ? "Selected date range" : `Year ${year}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(averageSales)}</div>
            <p className="text-xs text-muted-foreground">
              Per {reportType === "daily" ? "day" : reportType === "weekly" ? "week" : "month"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.length}</div>
            <p className="text-xs text-muted-foreground">
              {reportType === "daily" ? "days" : reportType === "weekly" ? "weeks" : "months"} of data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === "daily" ? "Daily Sales Trend" : reportType === "weekly" ? "Weekly Sales Trend" : "Monthly Sales Trend"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading chart data...</p>
                </div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => formatPrice(value)} />
                  <Tooltip formatter={(value) => formatPrice(Number(value))} />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for the selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === "daily" ? "Daily Sales Data" : reportType === "weekly" ? "Weekly Sales Data" : "Monthly Sales Data"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{reportType === "daily" ? "Date" : reportType === "weekly" ? "Week" : "Month"}</TableHead>
                <TableHead className="text-right">Sales Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                    No data available for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {reportType === "daily" 
                        ? (item as { day: string; total: string }).day 
                        : reportType === "weekly"
                        ? (item as { week: string; total: string }).week
                        : (item as { month: string; total: string }).month}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(item.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

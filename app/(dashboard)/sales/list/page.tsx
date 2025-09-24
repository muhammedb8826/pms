"use client";

import { useEffect, useState } from "react";
import { salesApi, Sale, medicineApi, Medicine } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function SalesListPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      const [allSales, medicinesResponse] = await Promise.all([
        salesApi.list(),
        medicineApi.getAll({ page: 1, limit: 1000 })
      ]);
      setSales(allSales);
      setMedicines(medicinesResponse.medicines || []);
      setTotalPages(Math.ceil(allSales.length / itemsPerPage));
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ET');
  };

  const getTotalItems = (sale: Sale) => {
    return sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      cash: "default",
      mobile_banking: "secondary",
      telebirr: "outline"
    } as const;

    return (
      <Badge variant={variants[method as keyof typeof variants] || "default"}>
        {method.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getMedicineName = (medicineId: number) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine) {
      return medicine.name;
    }
    
    // Temporary hardcoded mapping for testing
    const medicineNames: { [key: number]: string } = {
      1: "Paracetamol 500mg",
      2: "Aspirin 100mg", 
      3: "Ibuprofen 200mg",
      4: "Amoxicillin 250mg",
      5: "Metformin 500mg"
    };
    
    return medicineNames[medicineId] || `Medicine ID: ${medicineId}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales History</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/sales">
            <Button>
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading sales...
                </TableCell>
              </TableRow>
            ) : paginatedSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No sales found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                  <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                  <TableCell>
                    <span className="font-medium">{getTotalItems(sale)}</span>
                    {sale.items && sale.items.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {sale.items.slice(0, 2).map(item => getMedicineName(item.medicineId)).join(', ')}
                        {sale.items.length > 2 && ` +${sale.items.length - 2} more`}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(Number(sale.totalAmount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Cash</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(sale.saleDate)}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatPrice(sale.calculatedProfit || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="View Details"
                          onClick={() => setSelectedSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Sale Details - {sale.saleNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* Sale Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Sale Number</label>
                              <p className="font-medium">{sale.saleNumber}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Date</label>
                              <p>{formatDate(sale.saleDate)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Customer</label>
                              <p>{sale.customerName || 'Walk-in Customer'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Total Amount</label>
                              <p className="font-medium">{formatPrice(Number(sale.totalAmount))}</p>
                            </div>
                          </div>

                          {/* Items */}
                          <div>
                            <h4 className="font-medium mb-3">Items Sold</h4>
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Medicine</TableHead>
                                    <TableHead className="text-center">Quantity</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sale.items?.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">
                                        {getMedicineName(item.medicineId)}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {item.quantity}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatPrice(item.unitPrice)}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {formatPrice(item.unitPrice * item.quantity)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center text-lg font-bold">
                              <span>Total Amount:</span>
                              <span>{formatPrice(Number(sale.totalAmount))}</span>
                            </div>
                            {sale.calculatedProfit && (
                              <div className="flex justify-between items-center text-green-600 mt-2">
                                <span>Profit:</span>
                                <span>{formatPrice(sale.calculatedProfit)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {Math.ceil(filteredSales.length / itemsPerPage) > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {Math.ceil(filteredSales.length / itemsPerPage)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredSales.length / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(filteredSales.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

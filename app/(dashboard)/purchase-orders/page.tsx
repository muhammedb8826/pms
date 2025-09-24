"use client";

import { useEffect, useState } from "react";
import { purchaseOrderApi, PurchaseOrder, PurchaseOrderStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Package, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "all">("all");

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const response = await purchaseOrderApi.list({ page: 1, limit: 1000 });
      setPurchaseOrders(response.purchaseOrders);
    } catch (error) {
      console.error("Failed to load purchase orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: PurchaseOrderStatus) => {
    try {
      await purchaseOrderApi.updateStatus(id, status);
      toast.success("Purchase order status updated successfully");
      loadPurchaseOrders();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update purchase order status");
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ET');
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    const variants = {
      [PurchaseOrderStatus.DRAFT]: "secondary",
      [PurchaseOrderStatus.ORDERED]: "default",
      [PurchaseOrderStatus.RECEIVED]: "default",
      [PurchaseOrderStatus.CANCELLED]: "destructive"
    } as const;

    const colors = {
      [PurchaseOrderStatus.DRAFT]: "text-gray-600",
      [PurchaseOrderStatus.ORDERED]: "text-blue-600",
      [PurchaseOrderStatus.RECEIVED]: "text-green-600",
      [PurchaseOrderStatus.CANCELLED]: "text-red-600"
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTotalItems = (order: PurchaseOrder) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <Link href="/purchase-orders/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PurchaseOrderStatus | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={PurchaseOrderStatus.DRAFT}>Draft</SelectItem>
            <SelectItem value={PurchaseOrderStatus.ORDERED}>Ordered</SelectItem>
            <SelectItem value={PurchaseOrderStatus.RECEIVED}>Received</SelectItem>
            <SelectItem value={PurchaseOrderStatus.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Supplier ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Total Items</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading purchase orders...
                </TableCell>
              </TableRow>
            ) : filteredPurchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchaseOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.supplierId}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-sm">{formatDate(order.orderDate)}</TableCell>
                  <TableCell className="text-sm">
                    {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{getTotalItems(order)}</span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                    {order.notes || 'No notes'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Select
                        value={order.status}
                        onValueChange={(value) => {
                          if (value !== order.status) {
                            if (value === PurchaseOrderStatus.CANCELLED) {
                              if (confirm("Are you sure you want to cancel this order?")) {
                                handleStatusUpdate(order.id, value as PurchaseOrderStatus);
                              }
                            } else {
                              handleStatusUpdate(order.id, value as PurchaseOrderStatus);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PurchaseOrderStatus.DRAFT}>Draft</SelectItem>
                          <SelectItem value={PurchaseOrderStatus.ORDERED}>Ordered</SelectItem>
                          <SelectItem value={PurchaseOrderStatus.RECEIVED}>Received</SelectItem>
                          <SelectItem value={PurchaseOrderStatus.CANCELLED}>Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

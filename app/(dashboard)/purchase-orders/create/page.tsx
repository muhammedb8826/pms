"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { purchaseOrderApi, CreatePurchaseOrderDto, PurchaseOrderStatus, medicineApi, Medicine, supplierApi, Supplier } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PurchaseOrderItem {
  medicineId: number;
  quantity: number;
  medicine?: Medicine;
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [formData, setFormData] = useState({
    supplierId: "",
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: "",
    notes: ""
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  
  // Supplier creation modal state
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [medicinesResponse, suppliersResponse] = await Promise.all([
        medicineApi.getAll({ page: 1, limit: 1000, isActive: true }),
        supplierApi.list()
      ]);
      setMedicines(medicinesResponse.medicines);
      setSuppliers(suppliersResponse);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    }
  };

  const addItem = () => {
    setItems([...items, { medicineId: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Update medicine info when medicineId changes
    if (field === 'medicineId') {
      const medicine = medicines.find(m => m.id === parseInt(String(value)));
      newItems[index].medicine = medicine;
    }
    
    setItems(newItems);
  };

  const handleSupplierCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSupplier(true);

    try {
      const newSupplier = await supplierApi.create(supplierForm);
      setSuppliers([...suppliers, newSupplier]);
      
      // Auto-select the newly created supplier
      setFormData({ ...formData, supplierId: newSupplier.id.toString() });
      
      // Reset form and close modal
      setSupplierForm({ name: "", email: "", phone: "", address: "" });
      setSupplierModalOpen(false);
      
      toast.success("Supplier created successfully and selected");
    } catch (error) {
      console.error("Failed to create supplier:", error);
      toast.error("Failed to create supplier");
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const invalidItems = items.filter(item => !item.medicineId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error("Please check all items have valid medicine and quantity");
      return;
    }

    setLoading(true);
    
    try {
      const purchaseOrderData: CreatePurchaseOrderDto = {
        supplierId: parseInt(formData.supplierId),
        status: PurchaseOrderStatus.DRAFT,
        orderDate: formData.orderDate,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        notes: formData.notes || undefined,
        items: items.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity
        }))
      };

      await purchaseOrderApi.create(purchaseOrderData);
      toast.success("Purchase order created successfully");
      router.push("/purchase-orders");
    } catch (error) {
      console.error("Failed to create purchase order:", error);
      toast.error("Failed to create purchase order");
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Purchase Order</h1>
      </div>

      {/* Supplier Creation Modal - Outside main form to avoid conflicts */}
      <Dialog open={supplierModalOpen} onOpenChange={setSupplierModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSupplierCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName">Company Name *</Label>
              <Input
                id="supplierName"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierEmail">Email</Label>
              <Input
                id="supplierEmail"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierPhone">Phone</Label>
              <Input
                id="supplierPhone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierAddress">Address</Label>
              <Textarea
                id="supplierAddress"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSupplierModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingSupplier}>
                {creatingSupplier ? "Creating..." : "Create Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="supplierId">Supplier *</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSupplierModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Supplier
                  </Button>
                </div>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                <Input
                  id="expectedDeliveryDate"
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes for this purchase order"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Items</CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click &quot;Add Item&quot; to start.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Select
                        value={item.medicineId.toString()}
                        onValueChange={(value) => updateItem(index, 'medicineId', parseInt(value))}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select medicine" />
                        </SelectTrigger>
                        <SelectContent>
                          {medicines.map((medicine) => (
                            <SelectItem key={medicine.id} value={medicine.id.toString()}>
                              {medicine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {item.medicine && (
                        <div className="mt-1 text-sm text-gray-500">
                          <Badge variant="outline" className="mr-2">
                            {item.medicine.category?.name || 'No Category'}
                          </Badge>
                          <span>Stock: {item.medicine.quantity}</span>
                        </div>
                      )}
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="mt-6"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="font-medium">Total Items: {getTotalItems()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}

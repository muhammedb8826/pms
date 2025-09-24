"use client";

import { useState, useEffect } from "react";
import { medicineApi, Medicine, salesApi, CreateSaleDto, customerApi, Customer } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, ShoppingCart, User } from "lucide-react";
import { toast } from "sonner";

interface SaleItem {
  medicineId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  medicine?: Medicine;
}

export default function SalesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "", email: "", phone: "", address: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [medicineSearchTerm, setMedicineSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [medicinesResponse, customersResponse] = await Promise.all([
          medicineApi.getAll({ page: 1, limit: 1000, isActive: true }),
          customerApi.list()
        ]);
        setMedicines(medicinesResponse.medicines);
        setCustomers(customersResponse);
      } catch {
        toast.error("Failed to load data");
      }
    };
    loadData();
  }, []);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearchTerm.toLowerCase()) &&
    medicine.quantity > 0
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.includes(customerSearchTerm) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const addMedicineToSale = (medicine: Medicine) => {
    const existingItem = saleItems.find(item => item.medicineId === medicine.id);
    
    if (existingItem) {
      if (existingItem.quantity < medicine.quantity) {
        updateItemQuantity(medicine.id, existingItem.quantity + 1);
      } else {
        toast.error("Not enough stock available");
      }
    } else {
      const unitPrice = Number(medicine.sellingPrice) || 0;
      const newItem: SaleItem = {
        medicineId: medicine.id,
        quantity: 1,
        unitPrice: unitPrice,
        totalPrice: unitPrice,
        medicine: medicine
      };
      setSaleItems([...saleItems, newItem]);
    }
  };

  const updateItemQuantity = (medicineId: number, quantity: number) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine || quantity > medicine.quantity) {
      toast.error("Not enough stock available");
      return;
    }

    const updatedItems = saleItems.map(item => {
      if (item.medicineId === medicineId) {
        const unitPrice = Number(item.unitPrice) || 0;
        return {
          ...item,
          quantity,
          totalPrice: quantity * unitPrice
        };
      }
      return item;
    });
    setSaleItems(updatedItems);
  };

  const removeItem = (medicineId: number) => {
    setSaleItems(saleItems.filter(item => item.medicineId !== medicineId));
  };

  const handleCustomerSelect = (customerId: string) => {
    if (customerId === "walk-in") {
      setSelectedCustomer(null);
      setCustomerName("");
      setCustomerSearchTerm("");
    } else {
      const customer = customers.find(c => c.id.toString() === customerId);
      setSelectedCustomer(customer || null);
      setCustomerName(customer ? customer.name : "");
      setCustomerSearchTerm("");
    }
  };

  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    if (name && selectedCustomer) {
      setSelectedCustomer(null);
    }
  };

  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCustomer = await customerApi.create(newCustomerForm);
      setCustomers([...customers, newCustomer]);
      setSelectedCustomer(newCustomer);
      setCustomerName(newCustomer.name);
      setNewCustomerModalOpen(false);
      setNewCustomerForm({ name: "", email: "", phone: "", address: "" });
      setCustomerSearchTerm("");
      toast.success("New customer created and selected!");
    } catch (error) {
      console.error("Failed to create customer:", error);
      toast.error("Failed to create customer");
    }
  };

  const processSale = async () => {
    if (saleItems.length === 0) {
      toast.error("Please add items to the sale");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    setLoading(true);
    
    try {
      const saleData: CreateSaleDto = {
        saleDate: new Date().toISOString(),
        customerName: customerName.trim(),
        items: saleItems.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice)
        }))
      };

      console.log('Sending sale data:', JSON.stringify(saleData, null, 2));
      await salesApi.create(saleData);
      toast.success(`Sale completed successfully! Payment method: ${paymentMethod}`);
      
      // Reload medicines to get updated quantities
      const medicinesResponse = await medicineApi.getAll({ page: 1, limit: 1000, isActive: true });
      setMedicines(medicinesResponse.medicines);
      
      // Reset form
      setSaleItems([]);
      setSelectedCustomer(null);
      setCustomerName("");
      setCustomerSearchTerm("");
      setPaymentMethod("cash");
    } catch (error) {
      console.error("Failed to process sale:", error);
      toast.error("Failed to process sale");
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return saleItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  };

  const formatPrice = (price: number) => {
    const validPrice = Number(price) || 0;
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(validPrice);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">New Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medicine Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Medicines</CardTitle>
            <Input
              placeholder="Search medicines..."
              value={medicineSearchTerm}
              onChange={(e) => setMedicineSearchTerm(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto">
              {filteredMedicines.map((medicine) => (
                <div key={medicine.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{medicine.name}</div>
                    <div className="text-sm text-gray-500">
                      Stock: {medicine.quantity} | {formatPrice(medicine.sellingPrice)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addMedicineToSale(medicine)}
                    disabled={medicine.quantity === 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer *</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select
                    value={selectedCustomer ? selectedCustomer.id.toString() : "walk-in"}
                    onValueChange={handleCustomerSelect}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select or search customer" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search customers..."
                          value={customerSearchTerm}
                          onChange={(e) => {
                            setCustomerSearchTerm(e.target.value);
                            if (e.target.value && selectedCustomer) {
                              setSelectedCustomer(null);
                              setCustomerName("");
                            }
                          }}
                          className="h-8"
                        />
                      </div>
                      <div className="max-h-48 overflow-auto">
                        <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                        {customerSearchTerm && (
                          <div className="px-2 py-1 text-xs text-gray-500 border-b">
                            Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                          </div>
                        )}
                        {filteredCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} {customer.phone && `(${customer.phone})`}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                  <Dialog open={newCustomerModalOpen} onOpenChange={setNewCustomerModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateNewCustomer} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={newCustomerForm.name}
                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newCustomerForm.email}
                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newCustomerForm.phone}
                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            value={newCustomerForm.address}
                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                          />
                        </div>
                        <Button type="submit">Create Customer</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <Input
                placeholder="Or type customer name manually"
                value={customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                  <SelectItem value="telebirr">Telebirr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cart inside Customer Section */}
            {saleItems.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart ({saleItems.length} items)
                </h4>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {saleItems.map((item) => (
                    <div key={item.medicineId} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{item.medicine?.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatPrice(item.unitPrice)} each
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => updateItemQuantity(item.medicineId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => updateItemQuantity(item.medicineId, item.quantity + 1)}
                            disabled={item.quantity >= (item.medicine?.quantity || 0)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="font-medium text-xs w-16 text-right">
                          {formatPrice(item.totalPrice)}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 p-0"
                          onClick={() => removeItem(item.medicineId)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total:</span>
                    <span className="text-lg font-bold">{formatPrice(getTotalAmount())}</span>
                  </div>
                  <Button
                    className="w-full mt-2"
                    onClick={processSale}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Complete Sale"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

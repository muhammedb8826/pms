"use client";

import { useEffect, useState } from "react";
import { medicineApi, Medicine, CreateMedicineDto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MedicineForm } from "@/components/medicine-form";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const response = await medicineApi.getAll({ page: 1, limit: 1000 });
      setMedicines(response.medicines || []);
    } catch (error) {
      console.error("Failed to load medicines:", error);
      toast.error("Failed to load medicines");
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateMedicineDto | Partial<CreateMedicineDto>) => {
    try {
      if (editingMedicine) {
        await medicineApi.update(editingMedicine.id, data as unknown as Parameters<typeof medicineApi.update>[1]);
        toast.success("Medicine updated successfully");
      } else {
        await medicineApi.create(data as unknown as Parameters<typeof medicineApi.create>[0]);
        toast.success("Medicine created successfully");
      }
      setModalOpen(false);
      setEditingMedicine(null);
      loadMedicines();
    } catch (error: unknown) {
      console.error("Failed to save medicine:", error);
      
      // Extract descriptive error message
      let errorMessage = "Failed to save medicine";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string; error?: string; errors?: unknown[] } } };
        if (apiError.response?.data?.message) {
          // Backend validation error
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.data?.error) {
          // Alternative error format
          errorMessage = apiError.response.data.error;
        } else if (apiError.response?.data?.errors) {
          // Validation errors array
          const errors = apiError.response.data.errors;
          if (Array.isArray(errors) && errors.length > 0) {
            errorMessage = errors.map((err) => 
              typeof err === 'object' && err && 'message' in err ? String(err.message) : String(err)
            ).join(", ");
          }
        }
      } else if (error instanceof Error) {
        // Generic error message
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setModalOpen(true);
  };

  const handleDelete = (medicine: Medicine) => {
    setMedicineToDelete(medicine);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!medicineToDelete) return;
    
    try {
      await medicineApi.delete(medicineToDelete.id);
      toast.success("Medicine deleted successfully");
      loadMedicines();
    } catch (error) {
      console.error("Failed to delete medicine:", error);
      toast.error("Failed to delete medicine");
    } finally {
      setDeleteModalOpen(false);
      setMedicineToDelete(null);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingMedicine(null);
  };

  const filteredMedicines = (medicines || []).filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= 10) return { status: 'Low Stock', variant: 'secondary' as const };
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Medicines</h1>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMedicine(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
              </DialogTitle>
            </DialogHeader>
            <MedicineForm
              onSubmit={handleSubmit}
              initialData={editingMedicine || undefined}
              onCancel={handleModalClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
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
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Expiry Status</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          Loading medicines...
                        </TableCell>
                      </TableRow>
                    ) : filteredMedicines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          No medicines found.
                        </TableCell>
                      </TableRow>
            ) : (
              filteredMedicines.map((medicine) => {
                const stockStatus = getStockStatus(medicine.quantity);
                const expiryStatus = getExpiryStatus(medicine.expiryDate);
                
                return (
                  <TableRow key={medicine.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell>
                      {medicine.category?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${medicine.quantity <= 10 ? 'text-orange-600' : 'text-green-600'}`}>
                        {medicine.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{formatPrice(medicine.sellingPrice)}</TableCell>
                    <TableCell>{formatPrice(medicine.costPrice)}</TableCell>
                            <TableCell>
                              <span className={expiryStatus.status === 'Expired' ? 'text-red-600' : expiryStatus.status === 'Expiring Soon' ? 'text-orange-600' : ''}>
                                {formatDate(medicine.expiryDate)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={stockStatus.variant} className="text-xs w-fit">
                                {stockStatus.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={expiryStatus.variant} className="text-xs w-fit">
                                {expiryStatus.status}
                              </Badge>
                            </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {medicine.barcode || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(medicine)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(medicine)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medicine</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete <strong>{medicineToDelete?.name}</strong>? 
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Medicine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

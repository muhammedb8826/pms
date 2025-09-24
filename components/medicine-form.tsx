"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Medicine, CreateMedicineDto, UpdateMedicineDto, categoryApi } from "@/lib/api";

const medicineSchema = z.object({
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  categoryId: z.number().int({ message: "Category is required" }),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative"),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  manufacturingDate: z.string().min(1, "Manufacturing date is required"),
  barcodeNumber: z.string().optional(),
}).refine((data) => {
  // Ensure expiry date is ahead of manufacturing date
  if (data.expiryDate && data.manufacturingDate) {
    const expiryDate = new Date(data.expiryDate);
    const manufacturingDate = new Date(data.manufacturingDate);
    return expiryDate > manufacturingDate;
  }
  return true;
}, {
  message: "Expiry date must be ahead of manufacturing date",
  path: ["expiryDate"], // This will show the error on the expiry date field
});

type MedicineFormData = z.input<typeof medicineSchema>;

interface MedicineFormProps {
  initialData?: Medicine;
  onSubmit: (data: CreateMedicineDto | UpdateMedicineDto) => void | Promise<void>;
  onCancel: () => void;
}

export function MedicineForm({ initialData, onSubmit, onCancel }: MedicineFormProps) {
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      productName: initialData?.name || "",
      categoryId: initialData?.categoryId || undefined,
      quantity: initialData?.quantity || 0,
      sellingPrice: initialData?.sellingPrice || 0,
      costPrice: initialData?.costPrice || 0,
      expiryDate: initialData?.expiryDate ? initialData.expiryDate.slice(0, 10) : "",
      manufacturingDate: initialData?.manufacturingDate ? initialData.manufacturingDate.slice(0, 10) : "",
      barcodeNumber: initialData?.barcode || "",
    },
  });

  useEffect(() => {
    // Load categories and manufacturers for suggestions
    const loadData = async () => {
      try {
        const categoriesData = await categoryApi.list({ page: 1, limit: 1000, isActive: true }).then(r => r.categories);
        setCategories(categoriesData.map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // Watch manufacturing date and set a default expiry date (2 years ahead)
  const manufacturingDate = watch("manufacturingDate");
  useEffect(() => {
    if (manufacturingDate && !watch("expiryDate")) {
      const mfgDate = new Date(manufacturingDate);
      const defaultExpiryDate = new Date(mfgDate);
      defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 2); // Default 2 years expiry
      setValue("expiryDate", defaultExpiryDate.toISOString().split('T')[0]);
    }
  }, [manufacturingDate, setValue, watch]);

  const onFormSubmit = async (data: MedicineFormData) => {
    setIsLoading(true);
    setSubmitError(null); // Clear any previous errors
    
    try {
      // Map new fields to DTO shape
      const dto: CreateMedicineDto = {
        name: data.productName,
        categoryId: data.categoryId,
        barcode: data.barcodeNumber,
        quantity: Number(data.quantity),
        sellingPrice: Number(data.sellingPrice),
        costPrice: Number(data.costPrice),
        expiryDate: data.expiryDate,
        manufacturingDate: data.manufacturingDate,
      };
      await onSubmit(dto);
    } catch (error: unknown) {
      // Extract descriptive error message
      let errorMessage = "Failed to save medicine";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string; error?: string; errors?: unknown[] } } };
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        } else if (apiError.response?.data?.errors) {
          const errors = apiError.response.data.errors;
          if (Array.isArray(errors) && errors.length > 0) {
            errorMessage = errors.map((err) => 
              typeof err === 'object' && err && 'message' in err ? String(err.message) : String(err)
            ).join(", ");
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
      console.error("Medicine form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Submit Error Display */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error saving medicine</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{submitError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name *</Label>
          <Input id="productName" {...register("productName")} placeholder="e.g., Paracetamol 500mg" />
          {errors.productName && (
            <p className="text-sm text-red-600">{errors.productName.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={(watch("categoryId") as unknown as string) ?? undefined}
            onValueChange={(value) => setValue("categoryId" as unknown as "categoryId", Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-red-600">Category is required</p>
          )}
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input id="quantity" type="number" step="1" min="0" {...register("quantity", { valueAsNumber: true })} />
          {errors.quantity && (
            <p className="text-sm text-red-600">{errors.quantity.message}</p>
          )}
        </div>

        {/* Selling Price */}
        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling Price *</Label>
          <Input id="sellingPrice" type="number" step="0.01" min="0" {...register("sellingPrice", { valueAsNumber: true })} />
          {errors.sellingPrice && (
            <p className="text-sm text-red-600">{errors.sellingPrice.message}</p>
          )}
        </div>

        {/* Cost Price */}
        <div className="space-y-2">
          <Label htmlFor="costPrice">Cost Price *</Label>
          <Input id="costPrice" type="number" step="0.01" min="0" {...register("costPrice", { valueAsNumber: true })} />
          {errors.costPrice && (
            <p className="text-sm text-red-600">{errors.costPrice.message}</p>
          )}
        </div>

        {/* Expiry Date */}
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date *</Label>
          <Input 
            id="expiryDate" 
            type="date" 
            min={manufacturingDate || undefined}
            {...register("expiryDate")} 
          />
          <p className="text-xs text-muted-foreground">
            Must be after the manufacturing date
          </p>
          {errors.expiryDate && (
            <p className="text-sm text-red-600">{errors.expiryDate.message}</p>
          )}
        </div>

        {/* Manufacturing Date */}
        <div className="space-y-2">
          <Label htmlFor="manufacturingDate">Manufacturing Date *</Label>
          <Input 
            id="manufacturingDate" 
            type="date" 
            max={new Date().toISOString().split('T')[0]}
            {...register("manufacturingDate")} 
          />
          <p className="text-xs text-muted-foreground">
            Cannot be in the future
          </p>
          {errors.manufacturingDate && (
            <p className="text-sm text-red-600">{errors.manufacturingDate.message}</p>
          )}
        </div>

        {/* Barcode Number */}
        <div className="space-y-2">
          <Label htmlFor="barcodeNumber">Barcode Number</Label>
          <Input id="barcodeNumber" {...register("barcodeNumber")} placeholder="e.g., 1234567890123" />
          {errors.barcodeNumber && (
            <p className="text-sm text-red-600">{errors.barcodeNumber.message}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Medicine" : "Create Medicine"}
        </Button>
      </div>
    </form>
  );
}

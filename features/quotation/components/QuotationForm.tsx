"use client";

import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllCustomers } from "@/features/customer/hooks/useCustomers";
import { useAllProducts } from "@/features/product/hooks/useProducts";
import type { Customer } from "@/features/customer/types";
import type { Product } from "@/features/product/types";
import {
  useCreateQuotation,
  useUpdateQuotation,
} from "@/features/quotation/hooks/useQuotations";
import type {
  Quotation,
  QuotationStatus,
  CreateQuotationItemDto,
  CreateQuotationDto,
  UpdateQuotationDto,
} from "@/features/quotation/types";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

const itemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z
    .coerce
    .number()
    .min(0, "Unit price cannot be negative"),
  discount: z
    .coerce
    .number()
    .min(0, "Discount cannot be negative")
    .optional(),
  notes: z.string().optional(),
});

const quotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  validUntil: z.string().optional().nullable(),
  status: z.custom<QuotationStatus>().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
});

export interface QuotationFormProps {
  quotation?: Quotation;
  onSuccess?: () => void;
  onCancel?: () => void;
  formId?: string;
}

type ItemState = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  notes?: string;
};

export function QuotationForm({
  quotation,
  onSuccess,
  onCancel,
  formId,
}: QuotationFormProps) {
  // Handle nested customer object from API
  const initialCustomerId = quotation?.customer?.id || quotation?.customerId || "";
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [date, setDate] = useState(
    quotation?.date ?? new Date().toISOString().split("T")[0],
  );
  const [validUntil, setValidUntil] = useState<string | "">(
    quotation?.validUntil ?? "",
  );
  const [status, setStatus] = useState<QuotationStatus>(
    quotation?.status ?? "DRAFT",
  );
  const [notes, setNotes] = useState(quotation?.notes ?? "");
  const [items, setItems] = useState<ItemState[]>(
    quotation?.items?.length
      ? quotation.items.map((it) => {
          // Handle nested product object from API
          const productId = it.product?.id || it.productId || "";
          // Handle string/number conversion for prices
          const unitPrice = typeof it.unitPrice === 'string' ? parseFloat(it.unitPrice) || 0 : (it.unitPrice || 0);
          const discount = typeof it.discount === 'string' ? parseFloat(it.discount) || 0 : (it.discount || 0);
          return {
            productId,
            quantity: Number(it.quantity) || 0,
            unitPrice,
            discount,
            notes: it.notes ?? undefined,
          };
        })
      : [
          {
            productId: "",
            quantity: 1,
            unitPrice: 0,
            discount: 0,
          },
        ],
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const allCustomersQuery = useAllCustomers();
  const allProductsQuery = useAllProducts();

  const customers = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data =
      allCustomersQuery.data as Customer[] | WR<Customer[]> | undefined;
    if (!data) return [] as Customer[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data))
      return data.data;
    return [] as Customer[];
  }, [allCustomersQuery.data]);

  const products = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allProductsQuery.data as Product[] | WR<Product[]> | undefined;
    if (!data) return [] as Product[];
    if (Array.isArray(data)) return data;
    if ("success" in data && data.success && Array.isArray(data.data))
      return data.data;
    return [] as Product[];
  }, [allProductsQuery.data]);

  // Show loading state if products or customers are still loading
  const isLoadingData = allCustomersQuery.isLoading || allProductsQuery.isLoading;

  const { mutateAsync: createQuotation } = useCreateQuotation();
  const { mutateAsync: updateQuotation } = useUpdateQuotation();

  useEffect(() => {
    setFormError(null);
    setSubmitting(false);
  }, []);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { productId: "", quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem<T extends keyof ItemState>(
    index: number,
    field: T,
    value: ItemState[T],
  ) {
    setItems((prev) => {
      const draft = [...prev];
      (draft[index][field] as ItemState[T]) = value;
      return draft;
    });
  }

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => {
      const qty = Number(it.quantity || 0);
      const price = Number(it.unitPrice || 0);
      const disc = Number(it.discount || 0);
      const total = qty * price - disc;
      return sum + (Number.isFinite(total) ? total : 0);
    }, 0);
  }, [items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      // Filter out incomplete items (no productId) before validation
      const validItems = items.filter((it) => it.productId && it.productId.trim().length > 0);

      if (validItems.length === 0) {
        setFormError("Please add at least one item with a product selected.");
        setSubmitting(false);
        return;
      }

      const parsed = quotationSchema.parse({
        customerId,
        date,
        validUntil: validUntil || undefined,
        status,
        notes: notes || undefined,
        items: validItems,
      });

      const itemDtos: CreateQuotationItemDto[] = parsed.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount ?? 0,
        totalPrice: it.quantity * it.unitPrice - (it.discount ?? 0),
        notes: it.notes,
      }));

      if (quotation) {
        const dto: UpdateQuotationDto = {
          date: parsed.date,
          validUntil: parsed.validUntil,
          status: parsed.status,
          notes: parsed.notes,
          items: itemDtos,
        };
        await updateQuotation({ id: quotation.id, data: dto });
        handleApiSuccess("Quotation updated");
      } else {
        const dto: CreateQuotationDto = {
          customerId: parsed.customerId,
          date: parsed.date,
          validUntil: parsed.validUntil,
          status: parsed.status ?? "DRAFT",
          notes: parsed.notes,
          items: itemDtos,
        };
        await createQuotation(dto);
        handleApiSuccess("Quotation created");
      }

      onSuccess?.();
    } catch (err) {
      // Handle ZodError with user-friendly messages
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodError = err as { issues: Array<{ path: (string | number)[]; message: string }> };
        const errorMessages = zodError.issues.map((issue) => {
          const field = issue.path.join('.');
          return `${field ? `${field}: ` : ''}${issue.message}`;
        });
        setFormError(errorMessages.join('\n'));
      } else {
        const msg = handleApiError(err, {
          defaultMessage: "Failed to save quotation",
          showToast: false, // Don't show toast, we'll show it in the form
        });
        setFormError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      id={formId}
      className="space-y-6"
      noValidate
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Customer
              </label>
              <Select
                value={customerId || undefined}
                onValueChange={(v) => setCustomerId(v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingData ? (
                    <SelectItem value="__loading__" disabled>Loading customers...</SelectItem>
                  ) : customers.length === 0 ? (
                    <SelectItem value="__empty__" disabled>No customers available</SelectItem>
                  ) : (
                    customers.map((c: Customer) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDate(e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Valid Until
              </label>
              <Input
                type="date"
                value={validUntil || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValidUntil(e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus((v || "DRAFT") as QuotationStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="SENT">SENT</SelectItem>
                  <SelectItem value="ACCEPTED">ACCEPTED</SelectItem>
                  <SelectItem value="REJECTED">REJECTED</SelectItem>
                  <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Items</label>
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-2">Product</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit Price</th>
                    <th className="p-2">Discount</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Notes</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const lineTotal =
                      Number(it.quantity || 0) * Number(it.unitPrice || 0) -
                      Number(it.discount || 0);
                    return (
                      <tr key={idx} className="border-b">
                        <td className="p-2">
                          <Select
                            value={it.productId || undefined}
                            onValueChange={(v) =>
                              updateItem(idx, "productId", v || "")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingData ? (
                                <SelectItem value="__loading__" disabled>Loading products...</SelectItem>
                              ) : products.length === 0 ? (
                                <SelectItem value="__empty__" disabled>No products available</SelectItem>
                              ) : (
                                products.map((p: Product) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2 w-24">
                          <Input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateItem(
                                idx,
                                "quantity",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </td>
                        <td className="p-2 w-28">
                          <Input
                            type="number"
                            value={it.unitPrice}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateItem(
                                idx,
                                "unitPrice",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </td>
                        <td className="p-2 w-24">
                          <Input
                            type="number"
                            value={it.discount ?? 0}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateItem(
                                idx,
                                "discount",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </td>
                        <td className="p-2 w-28">
                          <Input
                            type="number"
                            value={Number(lineTotal).toFixed(2)}
                            readOnly
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={it.notes ?? ""}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateItem(idx, "notes", e.target.value)
                            }
                            placeholder="Notes"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <Button type="button" variant="outline" onClick={addItem}>
                Add row
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notes / Terms
            </label>
            <textarea
              className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              placeholder="Additional information or terms for this quotation"
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="border rounded-md p-4">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-semibold">
              {Number(totalAmount).toFixed(2)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
          {formError && (
            <div className="text-sm text-red-600 whitespace-pre-wrap">
              {formError}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}



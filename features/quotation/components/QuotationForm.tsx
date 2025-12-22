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
import { useAvailableBatchesForProduct } from "@/features/batch/hooks/useBatches";
import type { Customer } from "@/features/customer/types";
import type { Product } from "@/features/product/types";
import type { Batch } from "@/features/batch/types";
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
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
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

// Component for batch selection that auto-fills expiry date
function QuotationItemBatchSelect({
  productId,
  batchId,
  batchNumber,
  onBatchChange,
}: {
  productId: string;
  batchId?: string;
  batchNumber?: string;
  onBatchChange: (batchId: string, batchNumber: string, expiryDate: string) => void;
}) {
  const { batches, loading } = useAvailableBatchesForProduct(productId || undefined);

  // When editing, try to match batchNumber to a batch
  useEffect(() => {
    if (batchNumber && !batchId && batches.length > 0) {
      const matchedBatch = batches.find((b) => b.batchNumber === batchNumber);
      if (matchedBatch) {
        onBatchChange(
          matchedBatch.id,
          matchedBatch.batchNumber,
          matchedBatch.expiryDate,
        );
      }
    }
  }, [batchNumber, batchId, batches, onBatchChange]);

  if (!productId) {
    return (
      <Input className="h-8" placeholder="Select product first" disabled />
    );
  }

  if (loading) {
    return <Input className="h-8" placeholder="Loading batches..." disabled />;
  }

  if (batches.length === 0) {
    return <Input className="h-8" placeholder="No batches available" disabled />;
  }

  return (
    <Select
      value={batchId || undefined}
      onValueChange={(v) => {
        const selectedBatch = batches.find((b) => b.id === v);
        if (selectedBatch) {
          onBatchChange(
            selectedBatch.id,
            selectedBatch.batchNumber,
            selectedBatch.expiryDate,
          );
        }
      }}
    >
      <SelectTrigger className="h-8">
        <SelectValue placeholder="Select batch" />
      </SelectTrigger>
      <SelectContent>
        {batches.map((batch: Batch) => (
          <SelectItem key={batch.id} value={batch.id}>
            {batch.batchNumber} (Exp: {new Date(batch.expiryDate).toISOString().split("T")[0]})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type ItemState = {
  productId: string;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: string;
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
            batchId: "",
            batchNumber: it.batchNumber || "",
            expiryDate: it.expiryDate || "",
            quantity: Number(it.quantity) || 0,
            unitPrice,
            discount,
            notes: it.notes ?? undefined,
          };
        })
      : [
          {
            productId: "",
            batchId: "",
            batchNumber: "",
            expiryDate: "",
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
      { productId: "", batchId: "", batchNumber: "", expiryDate: "", quantity: 1, unitPrice: 0, discount: 0 },
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

  const { subtotal, totalDiscount, netTotal } = useMemo(() => {
    let subtotalAcc = 0;
    let discountAcc = 0;

    for (const it of items) {
      const qty = Number(it.quantity || 0);
      const price = Number(it.unitPrice || 0);
      const disc = Number(it.discount || 0);
      const lineSubtotal = qty * price;

      if (Number.isFinite(lineSubtotal)) {
        subtotalAcc += lineSubtotal;
      }
      if (Number.isFinite(disc)) {
        discountAcc += disc;
      }
    }

    const net = subtotalAcc - discountAcc;

    return {
      subtotal: Number.isFinite(subtotalAcc) ? subtotalAcc : 0,
      totalDiscount: Number.isFinite(discountAcc) ? discountAcc : 0,
      netTotal: Number.isFinite(net) ? net : 0,
    };
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
        batchNumber: it.batchNumber || null,
        expiryDate: it.expiryDate || null,
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
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3 rounded-md border bg-muted/40 p-4">
          <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Quotation Header</h2>
                <p className="text-xs text-muted-foreground">
                  Customer and validity details for this quotation.
                </p>
              </div>
              {quotation?.id && (
                <div className="rounded border bg-background px-3 py-1.5 text-right text-xs">
                  <div className="font-semibold">Quotation No</div>
                  <div className="font-mono text-[11px]">
                    {quotation.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide">
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
                      <SelectItem value="__loading__" disabled>
                        Loading customers...
                      </SelectItem>
                    ) : customers.length === 0 ? (
                      <SelectItem value="__empty__" disabled>
                        No customers available
                      </SelectItem>
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
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide">
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDate(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide">
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
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide">
                  Status
                </label>
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
          </div>
        </div>

        {/* Items grid */}
        <div className="space-y-2 rounded-md border bg-background/40 p-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Line Items</label>
            <span className="text-xs text-muted-foreground">
              
            </span>
          </div>
          <div className="overflow-x-auto rounded-md border bg-background/40">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="w-10 px-2 py-1 text-center">SN</th>
                  <th className="min-w-[150px] px-2 py-1">Product</th>
                  <th className="min-w-[110px] px-2 py-1">Batch No.</th>
                  <th className="min-w-[120px] px-2 py-1">Exp. Date</th>
                  <th className="w-20 px-2 py-1 text-right">Qty</th>
                  <th className="w-28 px-2 py-1 text-right">Unit Price</th>
                  <th className="w-24 px-2 py-1 text-right">Discount</th>
                  <th className="w-28 px-2 py-1 text-right">Line Total</th>
                  <th className="min-w-[140px] px-2 py-1">Notes</th>
                  <th className="w-20 px-2 py-1 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const lineTotal =
                    Number(it.quantity || 0) * Number(it.unitPrice || 0) -
                    Number(it.discount || 0);
                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1 text-center align-middle">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <Select
                          value={it.productId || undefined}
                          onValueChange={(v) => {
                            setItems((prev) => {
                              const draft = [...prev];
                              draft[idx] = {
                                ...draft[idx],
                                productId: v || "",
                                batchId: "",
                                batchNumber: "",
                                expiryDate: "",
                              };
                              return draft;
                            });
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingData ? (
                              <SelectItem value="__loading__" disabled>
                                Loading products...
                              </SelectItem>
                            ) : products.length === 0 ? (
                              <SelectItem value="__empty__" disabled>
                                No products available
                              </SelectItem>
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
                      <td className="px-2 py-1 align-middle">
                        <QuotationItemBatchSelect
                          productId={it.productId}
                          batchId={it.batchId}
                          batchNumber={it.batchNumber}
                          onBatchChange={(batchId, batchNumber, expiryDate) => {
                            setItems((prev) => {
                              const draft = [...prev];
                              draft[idx] = {
                                ...draft[idx],
                                batchId,
                                batchNumber,
                                expiryDate,
                              };
                              return draft;
                            });
                          }}
                        />
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <Input
                          className="h-8"
                          type="date"
                          value={it.expiryDate ?? ""}
                          readOnly
                        />
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateItem(
                              idx,
                              "quantity",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={it.unitPrice}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateItem(
                              idx,
                              "unitPrice",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={it.discount ?? 0}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateItem(
                              idx,
                              "discount",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={Number(lineTotal).toFixed(2)}
                          readOnly
                        />
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <Input
                          className="h-8"
                          value={it.notes ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateItem(idx, "notes", e.target.value)
                          }
                          placeholder="Notes"
                        />
                      </td>
                      <td className="px-2 py-1 text-center align-middle">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                        >
                          ✕
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
            >
              Add row
            </Button>
          </div>
        </div>

        {/* Summary under items */}
        <div className="space-y-2 rounded-md border bg-background p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Summary
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total discount</span>
              <span className="font-mono">{totalDiscount.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-2 border-t pt-2">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Net total</span>
              <span className="font-mono">{netTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-2 block text-sm font-medium">
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

        {/* Actions + errors */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="whitespace-pre-wrap text-sm text-red-600">
              {formError}
            </div>
          )}
        </div>
    </form>
  );
}


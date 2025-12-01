"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconPencil } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSale } from "@/features/sale/hooks/useSales";
import type { Sale, SaleItem } from "@/features/sale/types";
import { handleApiError } from "@/lib/utils/api-error-handler";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{value ?? "—"}</div>
    </div>
  );
}

export default function SaleDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const {
    data: sale,
    isLoading,
    error,
  } = useSale(id);

  // Type guard to ensure sale is properly typed
  const typedSale = sale as Sale | undefined;

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Invalid sale identifier.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading sale…</p>
      </div>
    );
  }

  if (error) {
    const message = handleApiError(error, {
      defaultMessage: "Failed to load sale",
      showToast: false,
      logError: false,
    });
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }

  if (!sale || !typedSale) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Sale not found.</p>
      </div>
    );
  }

  const totalAmount = typeof typedSale.totalAmount === "string" ? parseFloat(typedSale.totalAmount) : typedSale.totalAmount;
  const paidAmount = typedSale.paidAmount ? (typeof typedSale.paidAmount === "string" ? parseFloat(typedSale.paidAmount) : typedSale.paidAmount) : 0;
  const outstandingAmount = totalAmount - paidAmount;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "PENDING":
        return "secondary";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Sale Details</h1>
            <p className="text-sm text-muted-foreground">
              Sale #{typedSale.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/sales/${typedSale.id}/edit`)}
        >
          <IconPencil className="mr-2 size-4" />
          Edit Sale
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Sale Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Status */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Sale Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Customer"
                value={
                  <div>
                    <div className="font-medium">{typedSale.customer?.name ?? "—"}</div>
                    {typedSale.customer?.phone && (
                      <div className="text-xs text-muted-foreground">{typedSale.customer.phone}</div>
                    )}
                    {typedSale.customer?.email && (
                      <div className="text-xs text-muted-foreground">{typedSale.customer.email}</div>
                    )}
                  </div>
                }
              />
              {typedSale.salesperson && (
                <InfoRow
                  label="Salesperson"
                  value={
                    <div>
                      <div className="font-medium">
                        {typedSale.salesperson.firstName} {typedSale.salesperson.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{typedSale.salesperson.email}</div>
                    </div>
                  }
                />
              )}
              <InfoRow
                label="Date"
                value={typedSale.date ? new Date(typedSale.date).toLocaleDateString() : "—"}
              />
              <InfoRow
                label="Status"
                value={
                  <Badge variant={getStatusBadgeVariant(typedSale.status)} className="uppercase">
                    {typedSale.status}
                  </Badge>
                }
              />
              {typedSale.customer?.address && (
                <InfoRow
                  label="Address"
                  value={typedSale.customer.address}
                />
              )}
            </div>
            {typedSale.notes && (
              <div className="mt-4">
                <InfoRow label="Notes" value={typedSale.notes} />
              </div>
            )}
          </div>

          {/* Sale Items */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Sale Items</h2>
            {typedSale.items && typedSale.items.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typedSale.items.map((item: SaleItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product?.name ?? "—"}</div>
                            {item.product?.category?.name && (
                              <div className="text-xs text-muted-foreground">
                                {item.product.category.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.batch?.batchNumber ?? "—"}</div>
                            {item.batch?.expiryDate && (
                              <div className="text-xs text-muted-foreground">
                                Expires: {new Date(item.batch.expiryDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {currencyFormatter.format(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.discount ? currencyFormatter.format(item.discount) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {currencyFormatter.format(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items found.</p>
            )}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-sm font-semibold tabular-nums">
                  {currencyFormatter.format(totalAmount)}
                </span>
              </div>
              {paidAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paid Amount</span>
                  <span className="text-sm font-medium tabular-nums text-green-600">
                    {currencyFormatter.format(paidAmount)}
                  </span>
                </div>
              )}
              {outstandingAmount > 0 && (
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm font-medium">Outstanding</span>
                  <span className="text-sm font-semibold tabular-nums text-orange-600">
                    {currencyFormatter.format(outstandingAmount)}
                  </span>
                </div>
              )}
              {outstandingAmount <= 0 && paidAmount > 0 && (
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="default" className="text-xs">
                    Fully Paid
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Metadata</h2>
            <div className="space-y-3">
              {typedSale.createdAt && (
                <InfoRow
                  label="Created"
                  value={dateFormatter.format(new Date(typedSale.createdAt))}
                />
              )}
              {typedSale.updatedAt && (
                <InfoRow
                  label="Last Updated"
                  value={dateFormatter.format(new Date(typedSale.updatedAt))}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


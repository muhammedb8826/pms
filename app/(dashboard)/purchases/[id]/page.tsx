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
import { useGetPurchaseQuery } from "@/features/purchase/api/purchaseApi";
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

export default function PurchaseDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const {
    data: purchase,
    isLoading,
    error,
  } = useGetPurchaseQuery(id!, {
    skip: !id,
  });

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Invalid purchase identifier.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading purchase…</p>
      </div>
    );
  }

  if (error) {
    const message = handleApiError(error, {
      defaultMessage: "Failed to load purchase",
      showToast: false,
      logError: false,
    });
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Purchase not found.</p>
      </div>
    );
  }

  const outstandingAmount =
    Number(purchase.totalAmount ?? 0) - Number(purchase.paidAmount ?? 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/purchases")}
            aria-label="Back to purchases"
          >
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Purchase Details</h1>
            <p className="text-sm text-muted-foreground">
              Invoice {purchase.invoiceNo}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{purchase.status}</Badge>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/purchases/${purchase?.id ?? id}/edit`)
            }
            disabled={!purchase?.id && !id}
          >
            <IconPencil className="mr-2 size-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Supplier & Purchase Info
          </h2>
          <div className="grid gap-3">
            <InfoRow label="Supplier" value={purchase.supplier?.name} />
            <InfoRow label="Invoice" value={purchase.invoiceNo} />
            <InfoRow
              label="Date"
              value={
                purchase.date
                  ? dateFormatter.format(new Date(purchase.date))
                  : "—"
              }
            />
            <InfoRow label="Status" value={purchase.status} />
            {purchase.notes && <InfoRow label="Notes" value={purchase.notes} />}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Payment Summary
          </h2>
          <div className="grid gap-3">
            <InfoRow
              label="Total Amount"
              value={currencyFormatter.format(Number(purchase.totalAmount ?? 0))}
            />
            <InfoRow
              label="Paid Amount"
              value={currencyFormatter.format(Number(purchase.paidAmount ?? 0))}
            />
            <InfoRow
              label="Outstanding"
              value={currencyFormatter.format(outstandingAmount)}
            />
            <InfoRow
              label="Payment Method"
              value={purchase.paymentMethod?.name ?? "—"}
            />
            <InfoRow
              label="Created"
              value={
                purchase.createdAt
                  ? dateFormatter.format(new Date(purchase.createdAt))
                  : "—"
              }
            />
            <InfoRow
              label="Last Updated"
              value={
                purchase.updatedAt
                  ? dateFormatter.format(new Date(purchase.updatedAt))
                  : "—"
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Items ({purchase.items?.length ?? 0})
        </h2>
        {purchase.items && purchase.items.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((item) => (
                  <TableRow key={`${item.product?.id}-${item.batchNumber}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {item.product?.name}
                        </span>
                        {item.uom?.name && (
                          <span className="text-xs text-muted-foreground">
                            UoM: {item.uom.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.batchNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.expiryDate
                        ? dateFormatter.format(new Date(item.expiryDate))
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {currencyFormatter.format(Number(item.unitCost ?? 0))}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {currencyFormatter.format(Number(item.totalCost ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No purchase items found.</p>
        )}
      </div>
    </div>
  );
}


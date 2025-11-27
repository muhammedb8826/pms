"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCreditCard,
  IconExternalLink,
} from "@tabler/icons-react";

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
import { useGetCreditQuery } from "@/features/credit/api/creditApi";
import { CreditType, type Payment } from "@/features/credit/types";
import { handleApiError } from "@/lib/utils/api-error-handler";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type CreditPayment = Payment;

function formatPaymentMethod(method: CreditPayment["paymentMethod"]): string {
  if (!method) return "—";
  if (typeof method === "string") {
    return method.replace(/_/g, " ");
  }
  if (typeof method === "object") {
    if ("name" in method && typeof method.name === "string" && method.name.trim() !== "") {
      return method.name;
    }
    if ("description" in method && typeof method.description === "string" && method.description.trim() !== "") {
      return method.description;
    }
    if ("id" in method && typeof method.id === "string") {
      return method.id;
    }
  }
  return "—";
}

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

export default function CreditDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const {
    data: credit,
    isLoading,
    error,
  } = useGetCreditQuery(id!, {
    skip: !id,
  });

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Invalid credit identifier.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading credit…</p>
      </div>
    );
  }

  if (error) {
    const message = handleApiError(error, {
      defaultMessage: "Failed to load credit",
      showToast: false,
      logError: false,
    });
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }

  if (!credit) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Credit not found.</p>
      </div>
    );
  }

  const totalAmount = Number(credit.totalAmount ?? 0);
  const paidAmount = Number(credit.paidAmount ?? 0);
  const balanceAmount = Number(credit.balanceAmount ?? 0);
  const creditMetadata =
    credit && typeof credit === "object" && "metadata" in credit
      ? (credit as { metadata?: Record<string, unknown> | null }).metadata ?? null
      : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Back to credits"
            onClick={() => router.push("/credits")}
          >
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Credit Details</h1>
            <p className="text-sm text-muted-foreground">Credit #{credit.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{credit.type}</Badge>
          <Badge variant={credit.status === "PAID" ? "default" : "secondary"}>
            {credit.status}
          </Badge>
          {credit.purchase?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/purchases/${credit.purchase?.id}`)}
            >
              <IconExternalLink className="mr-2 size-4" />
              View Purchase
            </Button>
          )}
          {credit.sale?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/sales/${credit.sale?.id}`)}
            >
              <IconExternalLink className="mr-2 size-4" />
              View Sale
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Credit Overview
          </h2>
          <div className="grid gap-3">
            {credit.type === CreditType.PAYABLE ? (
              <InfoRow label="Supplier" value={credit.supplier?.name} />
            ) : (
              <InfoRow label="Customer" value={credit.customer?.name} />
            )}
            <InfoRow label="Type" value={credit.type} />
            <InfoRow label="Status" value={credit.status} />
            <InfoRow
              label="Due Date"
              value={
                credit.dueDate
                  ? shortDateFormatter.format(new Date(credit.dueDate))
                  : "—"
              }
            />
            {credit.paidDate && (
              <InfoRow
                label="Paid Date"
                value={shortDateFormatter.format(new Date(credit.paidDate))}
              />
            )}
            {credit.notes && <InfoRow label="Notes" value={credit.notes} />}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Amounts
          </h2>
          <div className="grid gap-3">
            <InfoRow
              label="Total Amount"
              value={currencyFormatter.format(totalAmount)}
            />
            <InfoRow
              label="Paid Amount"
              value={currencyFormatter.format(paidAmount)}
            />
            <InfoRow
              label="Outstanding"
              value={currencyFormatter.format(balanceAmount)}
            />
            <InfoRow
              label="Created"
              value={
                credit.createdAt
                  ? dateFormatter.format(new Date(credit.createdAt))
                  : "—"
              }
            />
            <InfoRow
              label="Updated"
              value={
                credit.updatedAt
                  ? dateFormatter.format(new Date(credit.updatedAt))
                  : "—"
              }
            />
          </div>
        </div>
      </div>

      {creditMetadata && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Metadata
          </h2>
          <pre className="max-h-64 overflow-auto rounded bg-muted/30 p-3 text-xs">
            {JSON.stringify(creditMetadata, null, 2)}
          </pre>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground">
              Payments ({credit.payments?.length ?? 0})
            </h2>
            <p className="text-xs text-muted-foreground">
              Record payments from the Credits page.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/credits")}>
            <IconCreditCard className="mr-2 size-4" />
            Manage Credits
          </Button>
        </div>
        {credit.payments && credit.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credit.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.paymentDate
                        ? dateFormatter.format(new Date(payment.paymentDate))
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {currencyFormatter.format(Number(payment.amount ?? 0))}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPaymentMethod(payment.paymentMethod)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.referenceNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        )}
      </div>
    </div>
  );
}


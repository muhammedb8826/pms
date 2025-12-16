"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuotations } from "@/features/quotation/hooks/useQuotations";
import { useAllCustomers } from "@/features/customer/hooks/useCustomers";
import type { Customer } from "@/features/customer/types";

export default function QuotationsPage() {
  const { quotations, isLoading, error } = useQuotations();
  const allCustomersQuery = useAllCustomers();

  // Create a customer lookup map
  const customerMap = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allCustomersQuery.data as Customer[] | WR<Customer[]> | undefined;
    let customers: Customer[] = [];
    if (data) {
      if (Array.isArray(data)) {
        customers = data;
      } else if ("success" in data && data.success && Array.isArray(data.data)) {
        customers = data.data;
      }
    }
    const map = new Map<string, string>();
    customers.forEach((c) => {
      map.set(c.id, c.name);
    });
    return map;
  }, [allCustomersQuery.data]);

  // Helper function to get customer name
  const getCustomerName = (quotation: typeof quotations[0]) => {
    // First try the nested customer object (from API)
    if (quotation.customer?.name) return quotation.customer.name;
    // Then try the flat customerName field (for backward compatibility)
    if (quotation.customerName) return quotation.customerName;
    // Then try lookup by customerId
    const customerId = quotation.customer?.id || quotation.customerId;
    if (customerId && customerMap.has(customerId)) {
      return customerMap.get(customerId)!;
    }
    // Fallback to showing ID
    if (customerId) {
      return `Customer ${customerId.slice(0, 8)}`;
    }
    return "—";
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-2 sm:items-center">
        <div>
          <h1 className="text-xl font-semibold">Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer quotations and convert them into sales.
          </p>
        </div>
        <Button asChild>
          <Link href="/quotations/new">New Quotation</Link>
        </Button>
      </div>

      {isLoading && <div>Loading…</div>}
      {error && !isLoading && (
        <div className="text-sm text-red-600">
          {typeof error === "string" ? error : "Failed to load quotations"}
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Valid Until</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-sm text-muted-foreground"
                  >
                    No quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="border-t">
                    <td className="px-3 py-2">
                      {new Date(q.date).toISOString().split("T")[0]}
                    </td>
                    <td className="px-3 py-2">
                      {getCustomerName(q)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(q.totalAmount ?? 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="uppercase">
                        {q.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      {q.validUntil
                        ? new Date(q.validUntil)
                            .toISOString()
                            .split("T")[0]
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/quotations/${q.id}/edit`}>Edit</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/requisition?quotationId=${q.id}`}>
                          Requisition
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



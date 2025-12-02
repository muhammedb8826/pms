"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { QuotationForm } from "@/features/quotation/components/QuotationForm";

export default function NewQuotationPage() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">New Quotation</h1>
        <p className="text-sm text-muted-foreground">
          Create a new quotation for a customer.
        </p>
      </div>
      <QuotationForm
        onSuccess={() => router.push("/quotations")}
        onCancel={() => router.push("/quotations")}
      />
    </div>
  );
}



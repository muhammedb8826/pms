"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { QuotationForm } from "@/features/quotation/components/QuotationForm";
import { useQuotation } from "@/features/quotation/hooks/useQuotations";

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const { data, isLoading, error } = useQuotation(id);

  if (!id) return null;
  if (isLoading) return <div className="p-4">Loading…</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Failed to load quotation.
      </div>
    );
  if (!data) return <div className="p-4">Quotation not found.</div>;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Edit Quotation</h1>
        <p className="text-sm text-muted-foreground">
          Update the quotation details and items.
        </p>
      </div>
      <QuotationForm
        quotation={data}
        onSuccess={() => router.push("/quotations")}
        onCancel={() => router.push("/quotations")}
      />
    </div>
  );
}



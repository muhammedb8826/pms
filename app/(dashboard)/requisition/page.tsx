"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useQuotation } from "@/features/quotation/hooks/useQuotations";
import { usePharmacySettings } from "@/features/settings/hooks/useSettings";

const formatEtbParts = (value: number | string | null | undefined) => {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(num)) {
    return { birr: "0", cents: "00" };
  }
  const rounded = Math.round(num * 100) / 100;
  const [birr, cents] = rounded.toFixed(2).split(".");
  return { birr, cents };
};

const RequisitionPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams.get("quotationId") || "";

  useEffect(() => {
    if (!quotationId) {
      router.replace("/quotations");
    }
  }, [quotationId, router]);

  const { data: quotation, isLoading, error } = useQuotation(quotationId || undefined);
  const { settings } = usePharmacySettings();

  const totalParts = useMemo(
    () => formatEtbParts(quotation?.totalAmount ?? 0),
    [quotation?.totalAmount],
  );

  const itemsWithPadding = useMemo(() => {
    const items = quotation?.items ?? [];
    const maxRows = 12;
    if (items.length >= maxRows) return items;
    return [
      ...items,
      ...Array.from({ length: maxRows - items.length }).map(() => null),
    ];
  }, [quotation?.items]);

  if (isLoading) {
    return <div className="p-4 text-sm">Loading requisition…</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load requisition. Please try again.
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-4 text-sm text-destructive">
        Quotation not found.
      </div>
    );
  }

  const customerName =
    quotation.customer?.name ?? quotation.customerName ?? "—";

  const customerAddress =
    (quotation.customer as { address?: string } | undefined)?.address ?? "—";

  const customerTin =
    (quotation.customer as { tinNumber?: string } | undefined)?.tinNumber ??
    "—";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Screen-only controls */}
      <div className="flex items-center justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Requisition Form</h1>
          <p className="text-sm text-muted-foreground">
            Printable requisition form generated from quotation #
            {quotation.id.slice(0, 8)}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      {/* Printable form */}
      <div className="mx-auto w-full max-w-4xl rounded-md border bg-white p-6 text-xs text-black shadow-sm print:border-0 print:p-0">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold uppercase">
              {settings.pharmacyName || "ABDULAZIZ PHARMACEUTICAL WHOLE SALES"}
            </h2>
            {settings.address && (
              <p className="text-[10px] leading-tight">{settings.address}</p>
            )}
            {settings.phone && (
              <p className="text-[10px] leading-tight">Tel: {settings.phone}</p>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold underline">REQUISITION FORM</h1>
          </div>
          <div className="text-right text-[10px]">
            <div className="flex items-center justify-end gap-1">
              <span className="font-semibold">DATE-</span>
              <span className="min-w-[80px] border-b border-black text-[10px] text-center">
                {quotation.date?.split("T")[0] ?? quotation.date}
              </span>
            </div>
          </div>
        </div>

        {/* Client details */}
        <div className="mb-2 text-[10px]">
          <div className="mb-1 flex items-center gap-2">
            <span className="w-24 font-semibold">CLIENT&apos;S NAME</span>
            <span className="flex-1 border-b border-black px-1 text-[10px]">
              {customerName}
            </span>
          </div>
          <div className="mb-1 flex items-center gap-2">
            <span className="w-24 font-semibold">ADDRESS</span>
            <span className="flex-1 border-b border-black px-1 text-[10px]">
              {customerAddress}
            </span>
            <span className="w-10 text-right font-semibold">Tin</span>
            <span className="min-w-[120px] border-b border-black px-1 text-[10px]">
              {customerTin}
            </span>
          </div>
        </div>

        {/* Items table */}
        <table className="mb-2 w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="border border-black px-1 py-1 text-center w-6">
                SN
              </th>
              <th className="border border-black px-1 py-1 text-left">
                ITEM DESCRIPTION
              </th>
              <th className="border border-black px-1 py-1 text-center w-20">
                Batch No.
              </th>
              <th className="border border-black px-1 py-1 text-center w-20">
                Exp.Date
              </th>
              <th className="border border-black px-1 py-1 text-center w-10">
                unit
              </th>
              <th className="border border-black px-1 py-1 text-center w-10">
                Qty
              </th>
              <th className="border border-black px-1 py-1 text-center w-20">
                unit price
                <div className="flex justify-between text-[9px]">
                  <span>Birr</span>
                  <span>Cnt</span>
                </div>
              </th>
              <th className="border border-black px-1 py-1 text-center w-24">
                Total price
                <div className="flex justify-between text-[9px]">
                  <span>Birr</span>
                  <span>Cnt</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {itemsWithPadding.map((item, index) => {
              const sn = index + 1;
              const unitPriceParts = formatEtbParts(
                item ? item.unitPrice : 0,
              );
              const lineTotalParts = formatEtbParts(
                item ? item.totalPrice : 0,
              );

              return (
                <tr key={index} className="h-6 align-middle">
                  <td className="border border-black px-1 text-center text-[10px]">
                    {sn}
                  </td>
                  <td className="border border-black px-1 text-[10px]">
                    {item?.product?.name ?? item?.productName ?? ""}
                  </td>
                  <td className="border border-black px-1 text-center text-[10px]">
                    {item?.batchNumber || ""}
                  </td>
                  <td className="border border-black px-1 text-center text-[10px]">
                    {item?.expiryDate
                      ? new Date(item.expiryDate).toISOString().split("T")[0]
                      : ""}
                  </td>
                  <td className="border border-black px-1 text-center text-[10px]">
                    {/* unit (if you later add per-product unit) */}
                  </td>
                  <td className="border border-black px-1 text-center text-[10px]">
                    {item ? item.quantity : ""}
                  </td>
                  <td className="border border-black px-1 text-[10px]">
                    <div className="flex justify-between gap-1">
                      <span className="flex-1 text-right">
                        {item ? unitPriceParts.birr : ""}
                      </span>
                      <span className="w-8 text-right">
                        {item ? unitPriceParts.cents : ""}
                      </span>
                    </div>
                  </td>
                  <td className="border border-black px-1 text-[10px]">
                    <div className="flex justify-between gap-1">
                      <span className="flex-1 text-right">
                        {item ? lineTotalParts.birr : ""}
                      </span>
                      <span className="w-8 text-right">
                        {item ? lineTotalParts.cents : ""}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total row */}
        <div className="mb-4 flex justify-end">
          <div className="min-w-[200px] border border-black text-[10px]">
            <div className="flex items-center justify-between border-b border-black px-1 py-1">
              <span className="font-semibold">TOTAL</span>
              <div className="flex flex-1 justify-end gap-1">
                <span className="flex-1 text-right">{totalParts.birr}</span>
                <span className="w-8 text-right">{totalParts.cents}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Requested / Approved boxes */}
        <div className="grid grid-cols-2 gap-4 text-[10px]">
          <div className="border border-black p-2">
            <div className="mb-2 font-semibold uppercase">REQUESTED BY</div>
            <div className="mb-1 flex items-center gap-2">
              <span className="w-16">Name:</span>
              <span className="flex-1 border-b border-black" />
            </div>
            <div className="mb-1 flex items-center gap-2">
              <span className="w-16">Date:</span>
              <span className="flex-1 border-b border-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16">Signature:</span>
              <span className="flex-1 border-b border-black" />
            </div>
          </div>

          <div className="border border-black p-2">
            <div className="mb-2 font-semibold uppercase">APPROVED BY</div>
            <div className="mb-1 flex items-center gap-2">
              <span className="w-16">Name:</span>
              <span className="flex-1 border-b border-black" />
            </div>
            <div className="mb-1 flex items-center gap-2">
              <span className="w-16">Date:</span>
              <span className="flex-1 border-b border-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16">Signature:</span>
              <span className="flex-1 border-b border-black" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionPage;

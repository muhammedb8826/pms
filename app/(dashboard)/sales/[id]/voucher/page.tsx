"use client";

import React, { useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconPrinter } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useSale } from "@/features/sale/hooks/useSales";
import type { Sale } from "@/features/sale/types";

// Simple helper to convert numbers to words (integer part only)
function amountInWords(amount: number): string {
  if (!Number.isFinite(amount)) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
    "Eighty", "Ninety",
  ];

  function toWords(n: number): string {
    if (n === 0) return "Zero";
    if (n < 0) return `Minus ${toWords(Math.abs(n))}`;
    let words = "";

    if (Math.floor(n / 1_000_000) > 0) {
      words += `${toWords(Math.floor(n / 1_000_000))} Million `;
      n %= 1_000_000;
    }
    if (Math.floor(n / 1_000) > 0) {
      words += `${toWords(Math.floor(n / 1_000))} Thousand `;
      n %= 1_000;
    }
    if (Math.floor(n / 100) > 0) {
      words += `${toWords(Math.floor(n / 100))} Hundred `;
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        words += ones[n];
      } else {
        words += tens[Math.floor(n / 10)];
        if (n % 10 > 0) {
          words += ` ${ones[n % 10]}`;
        }
      }
    }
    return words.trim();
  }

  const integerPart = Math.floor(amount);
  return `${toWords(integerPart)} Only`;
}

function mapSaleToVoucher(sale: Sale | null | undefined) {
  if (!sale) return null;

  const subTotal = sale.items.reduce(
    (sum, item) => sum + Number(item.totalPrice || 0),
    0,
  );
  const discountTotal = sale.items.reduce(
    (sum, item) => sum + Number(item.discount || 0),
    0,
  );
  const grandTotal = Number(sale.totalAmount || 0);
  const paidAmount = sale.paidAmount !== undefined ? Number(sale.paidAmount) : grandTotal;
  const balance = Math.max(0, grandTotal - paidAmount);

  const title =
    paidAmount >= grandTotal ? "Cash Sales Voucher" : "Credit Sales Voucher";

  return {
    header: {
      companyName: "Your Pharmacy Name",
      tin: "TIN: 0000000000",
      vat: "VAT: ________",
      title,
    },
    voucherInfo: {
      voucherNo: `CS-${sale.id.slice(0, 8).toUpperCase()}`,
      date: sale.date,
      store: "Main Store",
    },
    customer: {
      name: sale.customer?.name ?? "",
      phone: sale.customer?.phone ?? "",
      address: sale.customer?.address ?? "",
    },
    items: sale.items.map((item, index) => ({
      sn: index + 1,
      itemId: item.product?.productCode || item.product?.id,
      description: [
        item.product?.name,
        item.product?.strength,
        item.product?.dosageForm,
      ]
        .filter(Boolean)
        .join(" "),
      qty: item.quantity,
      unit: item.product?.defaultUom?.name || "",
      unitAmount: item.unitPrice,
      total: item.totalPrice,
    })),
    totals: {
      subTotal,
      discountTotal,
      grandTotal,
      paidAmount,
      balance,
      amountInWords: amountInWords(grandTotal),
    },
  };
}

export default function SaleVoucherPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const { data, isLoading, error } = useSale(id);

  const voucher = useMemo(() => mapSaleToVoucher(data), [data]);

  const handlePrint = React.useCallback(() => {
    try {
      window.print();
    } catch (error) {
      console.error("Print error:", error);
      alert("Unable to open print dialog. Please use Ctrl+P (or Cmd+P on Mac) to print.");
    }
  }, []);

  // Add keyboard shortcut for printing (Ctrl+P or Cmd+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrint]);

  if (!id) return null;
  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Failed to load sale voucher.
      </div>
    );
  if (!voucher)
    return <div className="p-4">Sale not found.</div>;

  const {
    header,
    voucherInfo,
    customer,
    items,
    totals,
  } = voucher;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatDate = (value: string) =>
    new Date(value).toISOString().split("T")[0];

  const printedAt = new Date().toLocaleString();

  return (
    <div className="voucher-page min-h-screen bg-white text-black print:bg-white print:text-black">
      <div className="no-print flex justify-between items-center mb-4 p-4 bg-gray-50 border-b sticky top-0 z-10 shadow-sm">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <IconPrinter className="mr-2 size-4" />
          Print Voucher
        </Button>
      </div>

      <div className="border border-black p-4 bg-white text-black print:border-black print:bg-white print:text-black">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold uppercase">
            {header.companyName}
          </h1>
          <div className="text-xs">
            <div>{header.tin}</div>
            <div>{header.vat}</div>
          </div>
          <h2 className="mt-2 text-base font-semibold uppercase underline">
            {header.title}
          </h2>
        </div>

        {/* Customer & Voucher Info */}
        <div className="flex justify-between text-xs mb-4 gap-8">
          <div className="flex-1">
            <div className="font-semibold mb-1">Customer</div>
            <div>Name: {customer.name}</div>
            {customer.phone && <div>Phone: {customer.phone}</div>}
            {customer.address && <div>Address: {customer.address}</div>}
          </div>
          <div className="flex-1 text-right">
            <div className="font-semibold mb-1">Voucher Info</div>
            <div>Voucher No: {voucherInfo.voucherNo}</div>
            <div>Date: {formatDate(voucherInfo.date)}</div>
            <div>Store: {voucherInfo.store}</div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs border-collapse mb-4">
          <thead>
            <tr>
              <th className="border border-black px-1 py-1 text-left w-8">SN</th>
              <th className="border border-black px-1 py-1 text-left w-24">
                Item Id
              </th>
              <th className="border border-black px-1 py-1 text-left">
                Description
              </th>
              <th className="border border-black px-1 py-1 text-right w-12">
                Qty
              </th>
              <th className="border border-black px-1 py-1 text-left w-16">
                Unit
              </th>
              <th className="border border-black px-1 py-1 text-right w-20">
                Unit Amount
              </th>
              <th className="border border-black px-1 py-1 text-right w-20">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sn}>
                <td className="border border-black px-1 py-0.5">
                  {item.sn}
                </td>
                <td className="border border-black px-1 py-0.5">
                  {item.itemId}
                </td>
                <td className="border border-black px-1 py-0.5">
                  {item.description}
                </td>
                <td className="border border-black px-1 py-0.5 text-right">
                  {item.qty}
                </td>
                <td className="border border-black px-1 py-0.5">
                  {item.unit}
                </td>
                <td className="border border-black px-1 py-0.5 text-right">
                  {formatCurrency(item.unitAmount)}
                </td>
                <td className="border border-black px-1 py-0.5 text-right">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Amount in Words */}
        <div className="flex justify-between text-xs mb-4">
          <div className="flex-1">
            <div className="font-semibold mb-1">
              Amount in words:
            </div>
            <div className="italic">
              {totals.amountInWords}
            </div>
          </div>
          <div className="flex-1">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black px-1 py-0.5">
                    Sub Total
                  </td>
                  <td className="border border-black px-1 py-0.5 text-right">
                    {formatCurrency(totals.subTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5">
                    Discount
                  </td>
                  <td className="border border-black px-1 py-0.5 text-right">
                    {formatCurrency(totals.discountTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5">
                    Not Taxable
                  </td>
                  <td className="border border-black px-1 py-0.5 text-right">
                    {formatCurrency(0)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 font-semibold">
                    Grand Total
                  </td>
                  <td className="border border-black px-1 py-0.5 text-right font-semibold">
                    {formatCurrency(totals.grandTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5">
                    Paid Amount
                  </td>
                  <td className="border border-black px-1 py-0.5 text-right">
                    {formatCurrency(totals.paidAmount)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5">
                    Balance
                  </td>
                  <td className="border border-black px-1 py-0.5 text-right">
                    {formatCurrency(totals.balance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs mt-6 space-y-2">
          <div className="flex justify-between mb-4">
            <span>Prepared by: ____________________</span>
            <span>Approved by: ____________________</span>
            <span>Received by: ____________________</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Printed on {printedAt}</span>
            <span className="font-semibold">
              INVALID WITHOUT STAMP OR SIGNATURE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}



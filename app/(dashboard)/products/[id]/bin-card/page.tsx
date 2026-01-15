"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconPrinter } from "@tabler/icons-react";
import { ProductBinCard } from "@/features/product/components/ProductBinCard";
import { useGetProductQuery } from "@/features/product/api/productApi";

export default function ProductBinCardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product } = useGetProductQuery(id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Action Bar - Hidden during Print */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="mr-2 size-4" /> Back to Products
        </Button>
        <Button onClick={handlePrint}>
          <IconPrinter className="mr-2 size-4" /> Print Ledger
        </Button>
      </div>

      {/* Header Info - Visible on Print */}
      <div className="border p-6 rounded-lg bg-white shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              STOCK RECORD CARD
            </h1>
            <p className="text-sm text-muted-foreground">
              Detailed Inventory Movement Ledger
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold uppercase">Product Code</div>
            <div className="text-xl font-mono">
              {product?.id ? product.id.split("-")[0] : "..."}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block">Product Name:</span>
            <span className="font-semibold">{product?.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Generic Name:</span>
            <span className="font-semibold">
              {product?.genericName || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Unit of Issue:</span>
            <span className="font-semibold">{product?.defaultUom?.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">
              Current Balance:
            </span>
            <span className="font-semibold text-blue-600">
              {product?.quantity}
            </span>
          </div>
        </div>
      </div>

      {/* The Ledger Table */}
      <div className="bg-white">
        <ProductBinCard productId={id} />
      </div>

      {/* Footer for Print */}
      <div className="hidden print:block mt-12">
        <div className="grid grid-cols-2 gap-20">
          <div className="border-t border-black pt-2 text-center text-xs">
            Pharmacist Signature
          </div>
          <div className="border-t border-black pt-2 text-center text-xs">
            Store Manager Signature
          </div>
        </div>
      </div>
    </div>
  );
}

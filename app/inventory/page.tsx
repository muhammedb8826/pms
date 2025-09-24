"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inventoryApi, InventoryItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function InventoryPage() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.list({ page: 1, limit: 50 }).then((res) => setData(res.inventory)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Inventory</h1>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No inventory</TableCell></TableRow>
            ) : (
              data.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.medicine?.name ?? it.medicineId}</TableCell>
                  <TableCell>{it.batchNumber}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell>{Number(it.unitPrice).toFixed(2)}</TableCell>
                  <TableCell>{Number(it.sellingPrice).toFixed(2)}</TableCell>
                  <TableCell>{it.expiryDate?.slice(0,10)}</TableCell>
                  <TableCell><Badge variant="secondary">{it.status}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



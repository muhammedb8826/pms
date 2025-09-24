"use client";

import { useEffect, useState } from "react";
import { adjustmentsApi, inventoryApi, StockAdjustment, CreateAdjustmentDto } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdjustmentsPage() {
  const [data, setData] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateAdjustmentDto>({ inventoryId: 0, adjustmentType: 'correction', quantityChange: 0, reason: '' });
  const [inventory, setInventory] = useState<Array<{ id: number; name: string; batch: string }>>([]);

  const load = () => adjustmentsApi.list().then(setData).finally(()=>setLoading(false));
  useEffect(() => { load(); inventoryApi.list({ page:1, limit:1000 }).then(r => setInventory(r.inventory.map(i => ({ id: i.id, name: i.medicine?.name ?? String(i.medicineId), batch: i.batchNumber })))) }, []);

  const save = async () => {
    try { await adjustmentsApi.create(form); toast.success('Adjustment created'); setOpen(false); load(); } catch { toast.error('Failed to create adjustment') }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Adjustments</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>New Adjustment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Adjustment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm">Inventory (Medicine - Batch)</label>
                <Select value={String(form.inventoryId)} onValueChange={(v)=>setForm({ ...form, inventoryId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Select inventory" /></SelectTrigger>
                  <SelectContent>
                    {inventory.map(i => (<SelectItem key={i.id} value={String(i.id)}>{i.name} - {i.batch}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm">Type</label>
                <Select value={form.adjustmentType} onValueChange={(v)=>setForm({ ...form, adjustmentType: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">damage</SelectItem>
                    <SelectItem value="theft">theft</SelectItem>
                    <SelectItem value="expired">expired</SelectItem>
                    <SelectItem value="correction">correction</SelectItem>
                    <SelectItem value="return">return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm">Quantity change</label><Input type="number" value={form.quantityChange} onChange={(e)=>setForm({ ...form, quantityChange: Number(e.target.value) })} /></div>
                <div className="space-y-1"><label className="text-sm">Reason</label><Input value={form.reason} onChange={(e)=>setForm({ ...form, reason: e.target.value })} /></div>
              </div>
              <div className="flex justify-end"><Button onClick={save}>Save</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Inventory</TableHead><TableHead>Type</TableHead><TableHead>Qty</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (<TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>) : data.length===0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No adjustments</TableCell></TableRow>
            ) : data.map(a => (
              <TableRow key={a.id}><TableCell>{a.inventoryId}</TableCell><TableCell>{a.adjustmentType}</TableCell><TableCell>{a.quantityChange}</TableCell><TableCell>{a.reason}</TableCell><TableCell>{(a as any).adjustmentDate?.slice(0,10)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



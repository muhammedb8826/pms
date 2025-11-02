"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSales, useDeleteSale } from '@/features/sale/hooks/useSales';
import { useAllCustomers } from '@/features/customer/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import type { Customer } from '@/features/customer/types';

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState<string>('');

  const statusFilter = status ? (status as 'PENDING' | 'COMPLETED' | 'CANCELLED') : undefined;
  const { sales: rawSales, total } = useSales({ page, limit, search: search || undefined, customerId: customerId || undefined, status: statusFilter, sortBy: 'date', sortOrder: 'DESC' });
  const sales = useMemo(() => Array.isArray(rawSales) ? rawSales : [], [rawSales]);

  const allCustomersQuery = useAllCustomers();
  const customers = useMemo(() => {
    type WrappedResponse<T> = { success: boolean; data: T };
    const data = allCustomersQuery.data as Customer[] | WrappedResponse<Customer[]> | undefined;
    if (!data) return [] as Customer[];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Customer[];
  }, [allCustomersQuery.data]);

  const [deleteSale] = useDeleteSale();

  async function handleDelete(id: string) {
    try {
      await deleteSale(id).unwrap();
      handleApiSuccess('Sale deleted');
    } catch (err) {
      handleApiError(err, { defaultMessage: 'Failed to delete sale' });
    }
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales</h1>
          <p className="text-sm text-muted-foreground">Manage sales records</p>
        </div>
        <Link href="/sales/new">
          <Button>New Sale</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input placeholder="Search by customer or notes" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={customerId} onValueChange={(v) => setCustomerId(v || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c: Customer) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v || 10))}>
          <SelectTrigger>
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2">Customer</th>
              <th className="p-2">Date</th>
              <th className="p-2">Total</th>
              <th className="p-2">Status</th>
              <th className="p-2">Items</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2 font-medium">{s.customer?.name || '-'}</td>
                <td className="p-2">{s.date ? new Date(s.date).toLocaleDateString() : '-'}</td>
                <td className="p-2">{Number(s.totalAmount).toFixed(2)}</td>
                <td className="p-2">
                  <span className="inline-flex items-center rounded px-2 py-1 text-xs border">
                    {s.status}
                  </span>
                </td>
                <td className="p-2">{Array.isArray(s.items) ? s.items.length : 0}</td>
                <td className="p-2 flex gap-2">
                  <Link href={`/sales/${s.id}/edit`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </Link>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      </div>
    </div>
  );
}

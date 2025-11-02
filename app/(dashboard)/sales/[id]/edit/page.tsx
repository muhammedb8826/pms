"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSale } from '@/features/sale/hooks/useSales';
import SaleForm from '@/features/sale/components/SaleForm';

export default function EditSalePage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const { data, isLoading, error } = useSale(id);

  if (!id) return null;
  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Failed to load sale.</div>;
  if (!data) return <div className="p-4">Sale not found.</div>;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Edit Sale</h1>
        <p className="text-sm text-muted-foreground">Update sale details</p>
      </div>
      <SaleForm sale={data} onSuccess={() => router.push('/sales')} onCancel={() => router.push('/sales')} />
    </div>
  );
}



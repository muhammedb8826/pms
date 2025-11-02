"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import SaleForm from '@/features/sale/components/SaleForm';

export default function NewSalePage() {
  const router = useRouter();
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">New Sale</h1>
        <p className="text-sm text-muted-foreground">Create a new sale</p>
      </div>
      <SaleForm onSuccess={() => router.push('/sales')} onCancel={() => router.push('/sales')} />
    </div>
  );
}



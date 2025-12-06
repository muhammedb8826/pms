"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import InteractiveSaleForm from '@/features/sale/components/InteractiveSaleForm';

export default function NewSalePage() {
  const router = useRouter();
  return (
    <InteractiveSaleForm 
      onSuccess={() => router.push('/sales')} 
      onCancel={() => router.push('/sales')} 
    />
  );
}



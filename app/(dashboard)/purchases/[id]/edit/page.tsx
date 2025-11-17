"use client";

import React, { useState, useMemo } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PurchaseForm } from '@/features/purchase/components/PurchaseForm';
import { useRouter, useParams } from 'next/navigation';
import { usePurchase, usePurchaseItems } from '@/features/purchase/hooks/usePurchases';
import type { Purchase } from '@/features/purchase/types';

export default function EditPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id as string;
  const { data: purchase, isLoading, error } = usePurchase(purchaseId);
  const { data: purchaseItemsData, isLoading: itemsLoading } = usePurchaseItems(purchaseId);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  console.log({purchase, purchaseItemsData});

  // Merge purchase items if they were fetched separately
  const purchaseWithItems = useMemo<Purchase | undefined>(() => {
    if (!purchase) return undefined;
    
    // If purchase already has items, use it as is
    if (purchase.items && purchase.items.length > 0) {
      return purchase;
    }
    // Otherwise, use items from the separate query (already unwrapped by hook)
    const itemsArray: Purchase['items'] = (purchaseItemsData && Array.isArray(purchaseItemsData) && purchaseItemsData.length > 0)
      ? purchaseItemsData
      : (purchase.items || []);
    
    // Always return a new object to ensure reference changes when items are loaded
    return {
      ...purchase,
      items: itemsArray,
    };
  }, [purchase, purchaseItemsData]);

  if (isLoading || itemsLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="p-4">Loading purchase...</div>
      </div>
    );
  }

  if (error || !purchaseWithItems) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="p-4 text-red-600">
          {error ? (error instanceof Error ? error.message : 'Failed to load purchase') : 'Purchase not found'}
        </div>
        <Button variant="outline" onClick={() => router.push('/purchases')}>Back to Purchases</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/purchases">Purchases</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Purchase</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-md border p-4">
        <h1 className="text-xl font-semibold mb-2">Edit Purchase</h1>
        <PurchaseForm
          purchase={purchaseWithItems}
          onSuccess={() => router.push('/purchases')}
          onCancel={() => router.push('/purchases')}
          onErrorChange={setFormError}
          onSubmittingChange={setFormSubmitting}
          formId="purchase-form"
          hideActions
        />
        <DialogFooter className="mt-4">
          <div className="flex w-full items-center justify-between pt-2">
            {formError ? <span className="text-xs text-red-600">{formError}</span> : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/purchases')}>Cancel</Button>
              <Button type="submit" form="purchase-form" disabled={formSubmitting || purchaseWithItems.status === 'COMPLETED'}>
                {formSubmitting ? 'Saving…' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </div>
    </div>
  );
}


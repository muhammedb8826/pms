"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  IconSearch,
  IconPlus,
  IconMinus,
  IconTrash,
  IconShoppingCart,
  IconX,
  IconUser,
  IconCalendar,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAllProducts } from '@/features/product/hooks/useProducts';
import { useAllCustomers } from '@/features/customer/hooks/useCustomers';
import { useAvailableBatchesForProduct } from '@/features/batch/hooks/useBatches';
import { usePaymentMethods } from '@/features/payment-method/hooks/usePaymentMethods';
import { useAllUnitOfMeasures } from '@/features/uom/hooks/useUnitOfMeasures';
import { useCreateSale } from '@/features/sale/hooks/useSales';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
import { resolveImageUrl } from '@/lib/utils/image-url';
import type { Product } from '@/features/product/types';
import type { Customer } from '@/features/customer/types';
import type { Batch as BatchType } from '@/features/batch/types';
import type { UnitOfMeasure } from '@/features/uom/types';
import type { CreateSaleDto } from '@/features/sale/types';

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'ETB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number | string | undefined | null): string => {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  if (isNaN(num) || !isFinite(num)) return currencyFormatter.format(0);
  return currencyFormatter.format(num);
};

interface CartItem {
  productId: string;
  product: Product;
  batchId: string;
  batch?: BatchType;
  uomId?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export type InteractiveSaleFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function InteractiveSaleForm({ onSuccess, onCancel }: InteractiveSaleFormProps) {
  const { user: currentUser } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createSale] = useCreateSale();
  const allCustomersQuery = useAllCustomers();
  const allProductsQuery = useAllProducts();
  const { paymentMethods } = usePaymentMethods({ includeInactive: false });

  // Find cash payment method (default)
  const cashPaymentMethod = paymentMethods.find(
    (pm) => pm.isActive && pm.name.toLowerCase() === 'cash'
  );

  // Auto-focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Set cash as default payment method when paidAmount > 0 and no payment method is selected
  useEffect(() => {
    if (paidAmount > 0 && !paymentMethodId && cashPaymentMethod) {
      setPaymentMethodId(cashPaymentMethod.id);
    }
  }, [paidAmount, paymentMethodId, cashPaymentMethod]);

  const customers = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allCustomersQuery.data as Customer[] | WR<Customer[]> | undefined;
    if (!data) return [] as Customer[];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Customer[];
  }, [allCustomersQuery.data]);

  const products = useMemo(() => {
    type WR<T> = { success: boolean; data: T };
    const data = allProductsQuery.data as Product[] | WR<Product[]> | undefined;
    if (!data) return [] as Product[];
    if (Array.isArray(data)) return data;
    if ('success' in data && data.success && Array.isArray(data.data)) return data.data;
    return [] as Product[];
  }, [allProductsQuery.data]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.productCode?.toLowerCase().includes(query) ||
        p.genericName?.toLowerCase().includes(query) ||
        p.category?.name?.toLowerCase().includes(query) ||
        p.manufacturer?.name?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const totalAmount = useMemo(() => {
    const total = cart.reduce((sum, item) => {
      const price = Number(item.totalPrice) || 0;
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    return isNaN(total) ? 0 : total;
  }, [cart]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        // Check if product already exists in cart
        const existingIndex = prev.findIndex((item) => item.productId === product.id);
        
        if (existingIndex >= 0) {
          // Product exists, increment quantity
          const updated = [...prev];
          const existingItem = updated[existingIndex];
          const newQuantity = existingItem.quantity + 1;
          const unitPrice = Number(existingItem.unitPrice) || Number(product.sellingPrice) || 0;
          const discount = Number(existingItem.discount) || 0;
          const newTotal = newQuantity * unitPrice - discount;
          
          updated[existingIndex] = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice: Math.max(0, isNaN(newTotal) ? 0 : newTotal),
          };
          return updated;
        } else {
          // Product doesn't exist, add new item
          const sellingPrice = Number(product.sellingPrice) || 0;
          const newItem: CartItem = {
            productId: product.id,
            product,
            batchId: '', // Will be selected in cart
            uomId: product.defaultUom?.id, // Auto-select default UOM
            quantity: 1,
            unitPrice: sellingPrice,
            discount: 0,
            totalPrice: sellingPrice,
          };
          return [...prev, newItem];
        }
      });
    },
    []
  );

  // Handle search input - if Enter is pressed and exact product code match, add to cart
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
        e.preventDefault();
        const query = searchQuery.trim().toLowerCase();
        
        // Try to find exact product code match first
        const exactMatch = products.find(
          (p) => p.productCode?.toLowerCase() === query
        );

        if (exactMatch) {
          handleAddToCart(exactMatch);
          setSearchQuery('');
          searchInputRef.current?.focus();
        }
        // If no exact match, just keep filtering (search continues)
      }
    },
    [products, searchQuery, handleAddToCart]
  );

  const handleUpdateQuantity = useCallback((index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQuantity = Math.max(1, item.quantity + delta);
      const unitPrice = Number(item.unitPrice) || Number(item.product.sellingPrice) || 0;
      const discount = Number(item.discount) || 0;
      const newTotal = newQuantity * unitPrice - discount;
      updated[index] = {
        ...item,
        quantity: newQuantity,
        totalPrice: Math.max(0, isNaN(newTotal) ? 0 : newTotal),
      };
      return updated;
    });
  }, []);

  const handleUpdatePrice = useCallback((index: number, price: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const validPrice = Number(price) || 0;
      const quantity = Number(item.quantity) || 1;
      const discount = Number(item.discount) || 0;
      const newTotal = quantity * validPrice - discount;
      updated[index] = {
        ...item,
        unitPrice: validPrice,
        totalPrice: Math.max(0, isNaN(newTotal) ? 0 : newTotal),
      };
      return updated;
    });
  }, []);

  const handleUpdateBatch = useCallback((index: number, batchId: string, batch?: BatchType) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        batchId,
        batch,
      };
      return updated;
    });
  }, []);

  const handleUpdateUom = useCallback((index: number, uomId: string | undefined) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        uomId,
      };
      return updated;
    });
  }, []);

  const handleRemoveFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!customerId) {
      handleApiError('Please select a customer', { showToast: true, logError: false });
      return;
    }
    if (cart.length === 0) {
      handleApiError('Please add at least one item to the cart', { showToast: true, logError: false });
      return;
    }

    const itemsWithoutBatches = cart.filter((item) => !item.batchId);
    if (itemsWithoutBatches.length > 0) {
      handleApiError('Please select a batch for all items', { showToast: true, logError: false });
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: CreateSaleDto = {
        customerId,
        date,
        status: 'COMPLETED',
        notes: notes || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          totalPrice: item.totalPrice,
          ...(item.uomId && { uomId: item.uomId }),
        })),
        ...(paidAmount > 0 && { 
          paidAmount,
          // If paidAmount > 0, ensure payment method is set (default to cash if not set)
          paymentMethodId: paymentMethodId || cashPaymentMethod?.id || ''
        }),
        ...(currentUser?.id && { salespersonId: currentUser.id }),
      };

      await createSale(dto).unwrap();
      handleApiSuccess('Sale created successfully');
      onSuccess?.();
    } catch (err) {
      // Log full error for debugging
      console.error('Sale creation error:', err);
      handleApiError(err, { defaultMessage: 'Failed to create sale' });
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, customerId, date, notes, paidAmount, paymentMethodId, currentUser, createSale, onSuccess]);

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar - Search */}
      <div className="flex-shrink-0 p-4 border-b bg-background">
        <div className="relative max-w-2xl">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search by name, code, barcode, category, manufacturer... (Press Enter to add by code)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10 h-12 text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
              onClick={() => setSearchQuery('')}
            >
              <IconX className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
        {/* Left: Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const imageUrl = resolveImageUrl(product.image);
              const isInCart = cart.some((item) => item.productId === product.id);
              const isLowStock = (product.quantity || 0) <= (product.minLevel || 0);
              const isOutOfStock = (product.quantity || 0) <= 0;

              const cartItem = cart.find((item) => item.productId === product.id);
              const cartQuantity = cartItem?.quantity || 0;

              return (
                <Card
                  key={product.id}
                  className={`transition-all hover:shadow-md ${
                    isInCart ? 'ring-2 ring-primary' : ''
                  } ${isOutOfStock ? 'opacity-50' : ''}`}
                >
                  <div className="relative aspect-square bg-muted">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <IconShoppingCart className="size-12" />
                      </div>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                        Low Stock
                      </Badge>
                    )}
                    {isOutOfStock && (
                      <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                        Out of Stock
                      </Badge>
                    )}
                    {isInCart && (
                      <Badge variant="default" className="absolute top-2 left-2 text-xs">
                        {cartQuantity} in Cart
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                    {product.productCode && (
                      <p className="text-xs text-muted-foreground mb-2">{product.productCode}</p>
                    )}
                    <p className="text-base font-bold text-primary mb-2">{formatCurrency(product.sellingPrice)}</p>
                    {product.quantity !== undefined && (
                      <p className="text-xs text-muted-foreground mb-2">Stock: {product.quantity}</p>
                    )}
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) {
                          handleAddToCart(product);
                        }
                      }}
                      disabled={isOutOfStock}
                      variant={isInCart ? 'outline' : 'default'}
                    >
                      {isInCart ? (
                        <>
                          <IconPlus className="mr-1 size-3" />
                          Add More ({cartQuantity})
                        </>
                      ) : (
                        <>
                          <IconPlus className="mr-1 size-3" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconSearch className="size-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'No products available'}
              </p>
            </div>
          )}
        </div>

        {/* Right: Cart and Checkout */}
        <div className="w-[500px] flex flex-col gap-4 flex-shrink-0">
          {/* Cart */}
          <Card className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <IconShoppingCart className="size-5" />
                Cart ({cart.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <CartItemCard
                      key={index}
                      item={item}
                      index={index}
                      onUpdateQuantity={handleUpdateQuantity}
                      onUpdatePrice={handleUpdatePrice}
                      onUpdateBatch={handleUpdateBatch}
                      onUpdateUom={handleUpdateUom}
                      onRemove={handleRemoveFromCart}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <IconShoppingCart className="size-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Your cart is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">Add products from the grid</p>
                </div>
              )}
            </div>
          </Card>

          {/* Checkout */}
          <Card>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <IconUser className="size-4" />
                  Customer *
                </label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c: Customer) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <IconCalendar className="size-4" />
                  Date
                </label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Paid Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              {paidAmount > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <Select
                    value={paymentMethodId || (cashPaymentMethod?.id ?? '')}
                    onValueChange={(v) => setPaymentMethodId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods
                        .filter((pm) => pm.isActive)
                        .map((pm) => (
                          <SelectItem key={pm.id} value={pm.id}>
                            {pm.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0 || !customerId}
              >
                {isSubmitting ? 'Processing...' : `Complete Sale - ${formatCurrency(totalAmount)}`}
              </Button>

              {onCancel && (
                <Button variant="outline" className="w-full" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Cart Item Component with Batch Selector
function CartItemCard({
  item,
  index,
  onUpdateQuantity,
  onUpdatePrice,
  onUpdateBatch,
  onUpdateUom,
  onRemove,
}: {
  item: CartItem;
  index: number;
  onUpdateQuantity: (index: number, delta: number) => void;
  onUpdatePrice: (index: number, price: number) => void;
  onUpdateBatch: (index: number, batchId: string, batch?: BatchType) => void;
  onUpdateUom: (index: number, uomId: string | undefined) => void;
  onRemove: (index: number) => void;
}) {
  const { batches } = useAvailableBatchesForProduct(item.productId);
  const imageUrl = resolveImageUrl(item.product.image);

  // Fetch UOMs filtered by product's unit category
  const uomsQuery = useAllUnitOfMeasures(
    item.product.unitCategory?.id ? { unitCategoryId: item.product.unitCategory.id } : undefined
  );
  const availableUoms = useMemo(() => {
    type WR<T> = { success?: boolean; data?: T };
    const data = uomsQuery.data as UnitOfMeasure[] | WR<UnitOfMeasure[]> | undefined;
    if (!data) return [] as UnitOfMeasure[];
    if (Array.isArray(data)) return data;
    if ('data' in data && Array.isArray(data.data)) return data.data;
    return [] as UnitOfMeasure[];
  }, [uomsQuery.data]);

  // Auto-select first batch if none selected and batches are available
  useEffect(() => {
    if (!item.batchId && batches.length > 0) {
      onUpdateBatch(index, batches[0].id, batches[0]);
    }
  }, [item.batchId, batches, index, onUpdateBatch]);

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start gap-3">
        <div className="relative size-16 flex-shrink-0 bg-muted rounded-md overflow-hidden">
          {imageUrl ? (
            <Image src={imageUrl} alt={item.product.name} fill className="object-contain p-1" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <IconShoppingCart className="size-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-1">{item.product.name}</h4>
          {item.product.productCode && (
            <p className="text-xs text-muted-foreground">{item.product.productCode}</p>
          )}
          <div className="mt-2 space-y-2">
            <Select
              value={item.batchId}
              onValueChange={(v) => {
                const batch = batches.find((b) => b.id === v);
                onUpdateBatch(index, v, batch);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batchNumber} (Qty: {batch.quantity ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={item.uomId || '__none__'}
              onValueChange={(v) => onUpdateUom(index, v === '__none__' ? undefined : v)}
              disabled={!item.product.unitCategory}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Base UOM</SelectItem>
                {availableUoms.map((uom) => (
                  <SelectItem key={uom.id} value={uom.id}>
                    {uom.abbreviation || uom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(index)}
        >
          <IconTrash className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => onUpdateQuantity(index, -1)}
            >
              <IconMinus className="size-3" />
            </Button>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => {
                const qty = parseInt(e.target.value) || 1;
                const currentQty = item.quantity;
                onUpdateQuantity(index, qty - currentQty);
              }}
              className="w-16 h-7 text-center text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => onUpdateQuantity(index, 1)}
            >
              <IconPlus className="size-3" />
            </Button>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Price</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.unitPrice > 0 ? item.unitPrice : item.product.sellingPrice || 0}
            onChange={(e) => {
              const price = parseFloat(e.target.value);
              if (!isNaN(price) && price >= 0) {
                onUpdatePrice(index, price);
              }
            }}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Total</label>
          <div className="h-7 flex items-center text-sm font-semibold">
            {formatCurrency(item.totalPrice)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveSaleForm;


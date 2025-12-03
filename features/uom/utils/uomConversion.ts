/**
 * UOM Conversion Utilities
 * 
 * Helper functions for converting quantities between different units of measure.
 * All quantities are stored in base UOM internally, but users can enter quantities
 * in any UOM, and the system automatically converts them.
 */

import type { UnitOfMeasure } from '@/features/uom/types';

/**
 * Type for UOM references that may not have all fields (e.g., from Product.defaultUom)
 */
export type UomLike = {
  id?: string;
  name?: string;
  abbreviation?: string;
  conversionRate?: string | number;
  baseUnit?: boolean;
};

/**
 * Check if a UOM is the base unit
 */
function isBaseUnit(uom: UomLike | null | undefined): boolean {
  if (!uom) return true;
  if (uom.baseUnit === true) return true;
  if (uom.baseUnit === false) return false;
  // If baseUnit is not specified, check conversionRate
  const rate = uom.conversionRate ? Number(uom.conversionRate) : 1;
  return rate === 1;
}

/**
 * Convert a quantity from a source UOM to base UOM
 * @param quantity - The quantity to convert
 * @param uom - The source UOM (if null/undefined, assumes quantity is already in base UOM)
 * @returns The quantity converted to base UOM
 */
export function convertToBase(quantity: number, uom: UnitOfMeasure | UomLike | null | undefined): number {
  if (!uom || isBaseUnit(uom)) {
    return quantity;
  }
  // Multiply by conversion rate to get base UOM
  // Example: 2000mg * 0.001 = 2g (if gram is base)
  const rate = uom.conversionRate ? Number(uom.conversionRate) : 1;
  return quantity * rate;
}

/**
 * Convert a quantity from base UOM to a target UOM
 * @param quantityInBase - The quantity in base UOM
 * @param targetUom - The target UOM (if null/undefined, returns quantity as-is)
 * @returns The quantity converted to target UOM
 */
export function convertFromBase(quantityInBase: number, targetUom: UnitOfMeasure | UomLike | null | undefined): number {
  if (!targetUom || isBaseUnit(targetUom)) {
    return quantityInBase;
  }
  // Divide by conversion rate to get target UOM
  // Example: 2g / 0.001 = 2000mg (if gram is base and milligram is target)
  const rate = targetUom.conversionRate ? Number(targetUom.conversionRate) : 1;
  return quantityInBase / rate;
}

/**
 * Format a quantity with its UOM abbreviation for display
 * @param quantity - The quantity to display
 * @param uom - The UOM (optional, can be UnitOfMeasure or UomLike)
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatted string like "2.5 g" or "2000 mg"
 */
export function formatQuantityWithUom(
  quantity: number,
  uom?: UnitOfMeasure | UomLike | null,
  precision: number = 2
): string {
  const formattedQty = Number(quantity).toFixed(precision);
  const abbreviation = uom?.abbreviation || uom?.name || '';
  return abbreviation ? `${formattedQty} ${abbreviation}` : formattedQty;
}

/**
 * Validate if a quantity (in a specific UOM) is available in a batch
 * The batch quantity is always stored in base UOM
 * @param requestedQuantity - The quantity requested (in source UOM)
 * @param requestedUom - The UOM of the requested quantity
 * @param availableQuantityInBase - The available quantity in base UOM
 * @returns Object with validation result and message
 */
export function validateQuantityAvailability(
  requestedQuantity: number,
  requestedUom: UnitOfMeasure | UomLike | null | undefined,
  availableQuantityInBase: number
): { valid: boolean; message?: string; requestedInBase: number } {
  const requestedInBase = convertToBase(requestedQuantity, requestedUom);
  const valid = availableQuantityInBase >= Math.round(requestedInBase);
  
  if (!valid) {
    const uomLabel = requestedUom ? ` (${requestedUom.abbreviation || requestedUom.name})` : '';
    return {
      valid: false,
      message: `Insufficient quantity. Available: ${availableQuantityInBase} (base UOM), Requested: ${requestedQuantity}${uomLabel}`,
      requestedInBase,
    };
  }
  
  return { valid: true, requestedInBase };
}


/**
 * API Response Utilities
 * Helper functions for working with standardized API responses
 */

import type {
  ErrorResponse,
  PaginationMeta,
} from '@/types/api-response';
import {
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse,
  unwrapResponseData,
} from '@/types/api-response';

/**
 * Extract data from a response, handling both wrapped and unwrapped formats
 * This is useful for RTK Query hooks that may return data in different formats
 */
export function getResponseData<T>(response: unknown): T | undefined {
  return unwrapResponseData<T>(response);
}

/**
 * Extract pagination metadata from a paginated response
 */
export function getPaginationMeta(response: unknown): PaginationMeta | undefined {
  if (isPaginatedResponse(response)) {
    return response.pagination;
  }
  return undefined;
}

/**
 * Check if a response indicates success
 */
export function isApiSuccess(response: unknown): boolean {
  return isSuccessResponse(response);
}

/**
 * Check if a response indicates an error
 */
export function isApiError(response: unknown): response is ErrorResponse {
  return isErrorResponse(response);
}

/**
 * Get error code from an error response
 */
export function getErrorCode(response: unknown): string | undefined {
  if (isErrorResponse(response)) {
    return response.error.code;
  }
  return undefined;
}

/**
 * Get error details from an error response
 */
export function getErrorDetails(response: unknown): string | undefined {
  if (isErrorResponse(response)) {
    return response.error.details;
  }
  return undefined;
}

/**
 * Get error field from a validation error response
 */
export function getErrorField(response: unknown): string | undefined {
  if (isErrorResponse(response)) {
    return response.error.field;
  }
  return undefined;
}

/**
 * Check if there's a next page in a paginated response
 */
export function hasNextPage(response: unknown): boolean {
  const pagination = getPaginationMeta(response);
  return pagination?.hasNext ?? false;
}

/**
 * Check if there's a previous page in a paginated response
 */
export function hasPrevPage(response: unknown): boolean {
  const pagination = getPaginationMeta(response);
  return pagination?.hasPrev ?? false;
}

/**
 * Get current page number from a paginated response
 */
export function getCurrentPage(response: unknown): number | undefined {
  const pagination = getPaginationMeta(response);
  return pagination?.page;
}

/**
 * Get total pages from a paginated response
 */
export function getTotalPages(response: unknown): number | undefined {
  const pagination = getPaginationMeta(response);
  return pagination?.totalPages;
}

/**
 * Get total items count from a paginated response
 */
export function getTotalItems(response: unknown): number | undefined {
  const pagination = getPaginationMeta(response);
  return pagination?.total;
}


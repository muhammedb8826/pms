/**
 * Standardized API Response Types
 * Based on PMS API backend response format
 */

/**
 * Base API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  timestamp: string;
  path?: string;
  data?: T; // Response payload (only in success responses)
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T; // Required in success responses
  message: string;
  timestamp: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse extends ApiResponse {
  success: false;
  message: string;
  timestamp: string;
  path?: string;
  error: {
    code: string;
    details?: string;
    field?: string;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = unknown> extends SuccessResponse<T[]> {
  success: true;
  data: T[];
  message: string;
  timestamp: string;
  pagination: PaginationMeta;
}

/**
 * Standard error codes used by the backend
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Type guard to check if response is a success response
 */
export function isSuccessResponse<T>(response: unknown): response is SuccessResponse<T> {
  return response !== null && typeof response === 'object' && 'success' in response && (response as { success?: unknown }).success === true && 'data' in response;
}

/**
 * Type guard to check if response is an error response
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return response !== null && typeof response === 'object' && 'success' in response && (response as { success?: unknown }).success === false && 'error' in response;
}

/**
 * Type guard to check if response is a paginated response
 */
export function isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
  return isSuccessResponse<T[]>(response) && 'pagination' in response;
}

/**
 * Unwrap response data, handling both wrapped and unwrapped responses
 * This is useful for backward compatibility with endpoints that might return data directly
 */
export function unwrapResponseData<T>(response: unknown): T | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  // If it's a success response with data
  if (isSuccessResponse<T>(response)) {
    return response.data;
  }

  // If it's already the data (unwrapped)
  if (!('success' in response)) {
    return response as T;
  }

  return undefined;
}

/**
 * Extract error message from various error response formats
 * Handles both standardized and legacy error formats
 */
export function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An error occurred';
  }

  // Standardized error response
  if (isErrorResponse(error)) {
    return error.message || error.error?.details || 'An error occurred';
  }

  // Legacy error format (statusCode-based)
  const legacyError = error as {
    statusCode?: number;
    message?: string | string[] | { message?: string; error?: string; statusCode?: number };
    error?: string;
  };

  // Try to extract message from various possible locations
  if (typeof legacyError.message === 'string') {
    return legacyError.message;
  }

  if (Array.isArray(legacyError.message)) {
    return legacyError.message[0] || 'Validation error';
  }

  if (legacyError.message && typeof legacyError.message === 'object') {
    const nested = legacyError.message as { message?: string; error?: string };
    return nested.message || nested.error || 'An error occurred';
  }

  if (typeof legacyError.error === 'string') {
    return legacyError.error;
  }

  return 'An error occurred';
}

/**
 * Extract error code from error response
 */
export function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  // Standardized error response
  if (isErrorResponse(error)) {
    return error.error.code;
  }

  // Legacy format - try to infer from status code
  const legacyError = error as { statusCode?: number; error?: { code?: string } };
  if (legacyError.error?.code) {
    return legacyError.error.code;
  }

  // Map status codes to error codes
  if (legacyError.statusCode) {
    const statusCodeMap: Record<number, string> = {
      400: ErrorCode.BAD_REQUEST,
      401: ErrorCode.UNAUTHORIZED,
      403: ErrorCode.FORBIDDEN,
      404: ErrorCode.NOT_FOUND,
      409: ErrorCode.CONFLICT,
      422: ErrorCode.VALIDATION_ERROR,
      429: ErrorCode.RATE_LIMIT_EXCEEDED,
      500: ErrorCode.INTERNAL_ERROR,
      503: ErrorCode.SERVICE_UNAVAILABLE,
    };
    return statusCodeMap[legacyError.statusCode];
  }

  return undefined;
}


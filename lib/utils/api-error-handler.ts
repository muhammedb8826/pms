import { toast } from 'sonner';
import type { ErrorResponse, ErrorCode } from '@/types/api-response';
import { extractErrorMessage as extractFromResponse, extractErrorCode } from '@/types/api-response';

/**
 * RTK Query error structure
 */
type RTKQueryError = {
  data?: ErrorResponse | unknown;
  status?: number;
  message?: string;
};

/**
 * Helper to extract string message from various formats
 */
function extractMessage(msg: unknown): string | undefined {
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg) && msg.length > 0 && typeof msg[0] === 'string') return msg[0];
  if (typeof msg === 'object' && msg !== null && 'message' in msg) {
    const nested = (msg as { message?: unknown }).message;
    if (typeof nested === 'string') return nested;
  }
  return undefined;
}

/**
 * Get user-friendly error message based on status code or error code
 */
function getErrorMessageFromCode(code: number | string): string {
  switch (code) {
    case 409:
    case ErrorCode.CONFLICT:
    case ErrorCode.DUPLICATE_ENTRY:
      return 'This resource already exists or conflicts with existing data';
    case 404:
    case ErrorCode.NOT_FOUND:
      return 'Resource not found';
    case 400:
    case ErrorCode.BAD_REQUEST:
      return 'Invalid data provided. Please check all fields.';
    case 422:
    case ErrorCode.VALIDATION_ERROR:
      return 'Validation failed. Please check your input.';
    case 401:
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.INVALID_CREDENTIALS:
    case ErrorCode.TOKEN_EXPIRED:
      return 'Authentication required. Please log in.';
    case 403:
    case ErrorCode.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case 429:
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 'Too many requests. Please try again later.';
    case 500:
    case ErrorCode.INTERNAL_ERROR:
      return 'An internal server error occurred. Please try again later.';
    case 503:
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return typeof code === 'number'
        ? `Operation failed (${code})`
        : `Operation failed: ${code}`;
  }
}

/**
 * Extract error message from RTK Query error structure
 * Handles both standardized and legacy API error formats
 */
export function extractErrorMessage(err: unknown): string {
  // First try the standardized extractor
  const standardizedMessage = extractFromResponse(err);
  if (standardizedMessage && standardizedMessage !== 'An error occurred') {
    return standardizedMessage;
  }

  // Fallback to legacy format handling
  if (!err) return 'Operation failed';

  const errorObj = err as RTKQueryError;
  const errorData = errorObj.data;

  // Try various error message paths (in order of priority)
  const candidates: (string | undefined)[] = [
    // Priority 1: Standardized error response
    errorData && typeof errorData === 'object' && 'message' in errorData
      ? extractMessage((errorData as { message?: unknown }).message)
      : undefined,
    // Priority 2: Legacy format - nested message.message
    errorData &&
    typeof errorData === 'object' &&
    'message' in errorData &&
    typeof (errorData as { message?: unknown }).message === 'object' &&
    !Array.isArray((errorData as { message?: unknown }).message)
      ? extractMessage(((errorData as { message?: { message?: unknown } }).message as { message?: unknown }).message)
      : undefined,
    // Priority 3: Legacy format - error.details
    errorData && typeof errorData === 'object' && 'error' in errorData
      ? (errorData as { error?: { details?: string } }).error?.details
      : undefined,
    // Priority 4: Top-level message
    errorObj.message,
  ];

  const firstString = candidates.find((c) => typeof c === 'string');
  if (firstString) {
    return firstString;
  }

  // Fallback to status code/error code messages
  const statusCode = errorObj.status;
  const errorCode = extractErrorCode(err);
  const code = errorCode || statusCode;

  if (code) {
    return getErrorMessageFromCode(code);
  }

  return 'Operation failed';
}

/**
 * Handle API errors with toast notification
 * Use this in catch blocks for API operations
 */
export function handleApiError(
  err: unknown,
  options?: {
    defaultMessage?: string;
    showToast?: boolean;
    logError?: boolean;
  }
): string {
  const { defaultMessage = 'Operation failed', showToast = true, logError = true } = options || {};

  if (logError) {
    console.error('API Error:', err);
  }

  const errorMessage = err ? extractErrorMessage(err) : defaultMessage;

  if (showToast) {
    toast.error(errorMessage);
  }

  return errorMessage;
}

/**
 * Show success toast notification
 * Use this after successful API operations
 */
export function handleApiSuccess(
  message: string,
  options?: {
    showToast?: boolean;
  }
): void {
  const { showToast = true } = options || {};
  if (showToast) {
    toast.success(message);
  }
}

/**
 * Extract error message for form validation
 * Returns the error message without showing toast (for form error states)
 */
export function extractFormError(err: unknown): string {
  return extractErrorMessage(err);
}


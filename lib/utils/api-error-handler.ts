import { toast } from 'sonner';
import type { ErrorResponse } from '@/types/api-response';
import { ErrorCode, extractErrorMessage as extractFromResponse, extractErrorCode } from '@/types/api-response';

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
  if (!err) return 'Operation failed';

  const errorObj = err as RTKQueryError;
  const errorData = errorObj.data;

  // First, try to extract from error.data if it's a standardized error response
  if (errorData && typeof errorData === 'object') {
    const standardizedMessage = extractFromResponse(errorData);
    if (standardizedMessage && standardizedMessage !== 'An error occurred') {
      return standardizedMessage;
    }
  }

  // Also try extracting from the error object itself (for direct error responses)
  const directMessage = extractFromResponse(err);
  if (directMessage && directMessage !== 'An error occurred') {
    return directMessage;
  }

  // Fallback to legacy format handling
  // Try various error message paths (in order of priority)
  const candidates: (string | undefined)[] = [
    // Priority 1: Standardized error response in data.message
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
    // Improved error logging to handle empty objects and provide useful debugging info
    try {
      if (err === null || err === undefined) {
        console.error('API Error: null or undefined');
      } else if (typeof err === 'object') {
        const errorObj = err as RTKQueryError;
        const keys = Object.keys(err);
        
        // Check if it's an empty object or has useful properties
        if (keys.length === 0 && !errorObj.data && !errorObj.status && !errorObj.message) {
          console.error('API Error: Empty error object. This may indicate a serialization issue.');
        } else {
          // Log structured error information
          const errorInfo: Record<string, unknown> = {
            type: err.constructor?.name || 'Unknown',
            keys: keys.length > 0 ? keys : 'No enumerable keys',
          };
          
          if (errorObj.status !== undefined) errorInfo.status = errorObj.status;
          if (errorObj.message) errorInfo.message = errorObj.message;
          if (errorObj.data !== undefined) {
            // Try to extract useful info from data without deep serialization
            if (typeof errorObj.data === 'object' && errorObj.data !== null) {
              const dataKeys = Object.keys(errorObj.data);
              errorInfo.dataKeys = dataKeys.length > 0 ? dataKeys : 'Empty data object';
              if ('message' in errorObj.data) {
                errorInfo.dataMessage = (errorObj.data as { message?: unknown }).message;
              }
            } else {
              errorInfo.data = errorObj.data;
            }
          }
          
          console.error('API Error:', errorInfo);
        }
      } else {
        console.error('API Error:', err);
      }
    } catch (logErr) {
      // Fallback if logging itself fails
      console.error('API Error: [Unable to log error details]', logErr);
    }
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


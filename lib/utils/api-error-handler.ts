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

  // Special handling for permission errors (403 / FORBIDDEN)
  if (errorObj.status === 403) {
    if (errorData && typeof errorData === 'object' && 'message' in errorData) {
      const msg = (errorData as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    // Fallback generic permission message
    return getErrorMessageFromCode(403);
  }

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
    try {
      if (err === null || err === undefined) {
        console.error('API Error: null or undefined');
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as RTKQueryError;
        // Extract meaningful information from RTK Query error structure
        const logData: Record<string, unknown> = {};
        
        // Only add status if it's a valid number
        if (typeof errorObj.status === 'number' && !isNaN(errorObj.status)) {
          logData.status = errorObj.status;
        }
        
        // Only add message if it's a non-empty string
        if (typeof errorObj.message === 'string' && errorObj.message.trim().length > 0) {
          logData.message = errorObj.message;
        }
        
        // Process error.data if it exists
        if (errorObj.data !== undefined && errorObj.data !== null) {
          if (typeof errorObj.data === 'object') {
            // Extract message from error.data if it's an object
            if ('message' in errorObj.data) {
              const msg = (errorObj.data as { message?: unknown }).message;
              if (typeof msg === 'string' && msg.trim().length > 0) {
                logData.errorMessage = msg;
              }
            }
            // Also check for error code
            if ('error' in errorObj.data && typeof errorObj.data.error === 'object' && errorObj.data.error !== null) {
              const errorCode = (errorObj.data.error as { code?: unknown }).code;
              if (errorCode !== undefined && errorCode !== null && errorCode !== '') {
                logData.errorCode = errorCode;
              }
            }
            // Check if data object has other meaningful properties
            const dataObj = errorObj.data as Record<string, unknown>;
            const dataKeys = Object.keys(dataObj).filter(key => {
              const val = dataObj[key];
              return val !== undefined && val !== null && val !== '';
            });
            if (dataKeys.length > 0 && !('message' in errorObj.data && 'error' in errorObj.data)) {
              // Only add data if it has meaningful keys beyond message/error
              logData.data = errorObj.data;
            }
          } else {
            // Non-object data (string, number, etc.)
            logData.data = errorObj.data;
          }
        }
        
        // Only log if we actually have meaningful data with non-empty values
        const meaningfulKeys = Object.keys(logData).filter(key => {
          const val = logData[key];
          if (val === undefined || val === null || val === '') return false;
          if (typeof val === 'string' && val.trim().length === 0) return false;
          if (typeof val === 'object') {
            // Check if it's an empty object or array
            if (Array.isArray(val)) {
              return val.length > 0;
            }
            const objKeys = Object.keys(val as Record<string, unknown>);
            if (objKeys.length === 0) return false;
            // Check if object has any non-empty values
            return objKeys.some(k => {
              const objVal = (val as Record<string, unknown>)[k];
              return objVal !== undefined && objVal !== null && objVal !== '';
            });
          }
          return true;
        });
        
        if (meaningfulKeys.length > 0) {
          // Only include meaningful keys in the log
          const filteredLogData: Record<string, unknown> = {};
          meaningfulKeys.forEach(key => {
            const val = logData[key];
            // Double-check the value is still meaningful before adding
            if (val !== undefined && val !== null && val !== '') {
              if (typeof val === 'string' && val.trim().length > 0) {
                filteredLogData[key] = val;
              } else if (typeof val === 'object') {
                if (Array.isArray(val) && val.length > 0) {
                  filteredLogData[key] = val;
                } else if (!Array.isArray(val)) {
                  const objKeys = Object.keys(val as Record<string, unknown>);
                  if (objKeys.length > 0) {
                    filteredLogData[key] = val;
                  }
                }
              } else {
                filteredLogData[key] = val;
              }
            }
          });
          
          // Final check: only log if filteredLogData has actual content
          // First check if we have any keys at all
          const hasKeys = Object.keys(filteredLogData).length > 0;
          
          if (hasKeys) {
            // Check if any values are actually non-empty
            const hasNonEmptyValues = Object.values(filteredLogData).some(val => {
              if (val === null || val === undefined || val === '') return false;
              if (typeof val === 'string' && val.trim().length === 0) return false;
              if (Array.isArray(val) && val.length === 0) return false;
              if (typeof val === 'object' && !Array.isArray(val)) {
                const objKeys = Object.keys(val as Record<string, unknown>);
                if (objKeys.length === 0) return false;
                // Recursively check if nested object has any non-empty values
                return Object.values(val as Record<string, unknown>).some(nestedVal => {
                  if (nestedVal === null || nestedVal === undefined || nestedVal === '') return false;
                  if (typeof nestedVal === 'string' && nestedVal.trim().length === 0) return false;
                  if (Array.isArray(nestedVal) && nestedVal.length === 0) return false;
                  return true;
                });
              }
              return true;
            });
            
            // Also check serialized version to catch edge cases
            const serialized = JSON.stringify(filteredLogData);
            const isEmptyObject = serialized === '{}' || serialized === '[]';
            
            // Only log if we have non-empty values AND serialized version is not empty
            if (hasNonEmptyValues && !isEmptyObject) {
              console.error('API Error:', filteredLogData);
            }
            // Otherwise silent: all values were filtered out or serialized to {}
          }
          // Otherwise silent: no keys in filteredLogData
        } else {
          // Check if original error has any enumerable properties
          const originalKeys = Object.keys(err as Record<string, unknown>);
          if (originalKeys.length > 0) {
            // Log original error if it has keys (might have non-enumerable properties)
            console.error('API Error:', err);
          }
          // Otherwise silent: completely empty error object
        }
      } else {
        console.error('API Error:', err);
      }
    } catch (logErr) {
      // Fallback if logging itself fails
      console.error('API Error: [Unable to log error details]', logErr);
      console.error('Original error (fallback):', err);
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


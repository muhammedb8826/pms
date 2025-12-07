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
    // Check for message directly in error.data (most common case) - check this FIRST
    if ('message' in errorData) {
      const msg = (errorData as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        // Check if this is a foreign key constraint error and provide user-friendly message
        if (msg.includes('violates foreign key constraint') || msg.includes('foreign key constraint')) {
          // Try to extract which table is referenced
          if (msg.includes('on table "sale"') || msg.includes('on table "purchase"')) {
            const tableName = msg.includes('on table "sale"') ? 'sales' : 'purchases';
            return `Cannot delete this record because it has associated ${tableName}. Please delete the related ${tableName} first.`;
          }
          // Generic foreign key constraint message
          return 'Cannot delete this record because it is referenced by other records. Please remove the references first.';
        }
        return msg;
      }
      // Handle array of messages
      if (Array.isArray(msg) && msg.length > 0 && typeof msg[0] === 'string') {
        const firstMsg = msg[0];
        // Check for foreign key constraint in array messages too
        if (firstMsg.includes('violates foreign key constraint') || firstMsg.includes('foreign key constraint')) {
          if (firstMsg.includes('on table "sale"') || firstMsg.includes('on table "purchase"')) {
            const tableName = firstMsg.includes('on table "sale"') ? 'sales' : 'purchases';
            return `Cannot delete this record because it has associated ${tableName}. Please delete the related ${tableName} first.`;
          }
          return 'Cannot delete this record because it is referenced by other records. Please remove the references first.';
        }
        return firstMsg;
      }
    }
    
    // Check for nested error.message structure
    if ('error' in errorData && typeof errorData.error === 'object' && errorData.error !== null) {
      const nestedError = errorData.error as { message?: string; details?: string };
      if (nestedError.message && typeof nestedError.message === 'string' && nestedError.message.trim().length > 0) {
        // Check for foreign key constraint in nested error message
        if (nestedError.message.includes('violates foreign key constraint') || nestedError.message.includes('foreign key constraint')) {
          if (nestedError.message.includes('on table "sale"') || nestedError.message.includes('on table "purchase"')) {
            const tableName = nestedError.message.includes('on table "sale"') ? 'sales' : 'purchases';
            return `Cannot delete this record because it has associated ${tableName}. Please delete the related ${tableName} first.`;
          }
          return 'Cannot delete this record because it is referenced by other records. Please remove the references first.';
        }
        return nestedError.message;
      }
      if (nestedError.details && typeof nestedError.details === 'string' && nestedError.details.trim().length > 0) {
        // Check for foreign key constraint in nested error details
        if (nestedError.details.includes('violates foreign key constraint') || nestedError.details.includes('foreign key constraint')) {
          if (nestedError.details.includes('on table "sale"') || nestedError.details.includes('on table "purchase"')) {
            const tableName = nestedError.details.includes('on table "sale"') ? 'sales' : 'purchases';
            return `Cannot delete this record because it has associated ${tableName}. Please delete the related ${tableName} first.`;
          }
          return 'Cannot delete this record because it is referenced by other records. Please remove the references first.';
        }
        return nestedError.details;
      }
    }
    
    const standardizedMessage = extractFromResponse(errorData);
    if (standardizedMessage && standardizedMessage !== 'An error occurred') {
      return standardizedMessage;
    }
    
    // Also check for direct message in error.data when success is false
    if ('success' in errorData && (errorData as { success?: unknown }).success === false) {
      const msg = (errorData as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
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
    // Check for foreign key constraint in fallback messages
    if (firstString.includes('violates foreign key constraint') || firstString.includes('foreign key constraint')) {
      if (firstString.includes('on table "sale"') || firstString.includes('on table "purchase"')) {
        const tableName = firstString.includes('on table "sale"') ? 'sales' : 'purchases';
        return `Cannot delete this record because it has associated ${tableName}. Please delete the related ${tableName} first.`;
      }
      return 'Cannot delete this record because it is referenced by other records. Please remove the references first.';
    }
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
              
              // Simplified logging - just log the key fields directly
              const logData: Record<string, unknown> = {};
              
              if (typeof errorObj.status === 'number') {
                logData.status = errorObj.status;
              }
              
              if (typeof errorObj.message === 'string' && errorObj.message.trim().length > 0) {
                logData.message = errorObj.message;
              }
              
              // Log error.data if it exists and has content
              if (errorObj.data !== undefined && errorObj.data !== null) {
                // If data is an object, try to extract message first
                if (typeof errorObj.data === 'object') {
                  const dataObj = errorObj.data as Record<string, unknown>;
                  
                  // Extract message if present
                  if ('message' in dataObj && typeof dataObj.message === 'string' && dataObj.message.trim().length > 0) {
                    logData.errorMessage = dataObj.message;
                  }
                  
                  // If data has meaningful content, include it
                  const dataKeys = Object.keys(dataObj);
                  if (dataKeys.length > 0) {
                    logData.data = errorObj.data;
                  }
                } else {
                  // Non-object data
                  logData.data = errorObj.data;
                }
              }
              
              // Only log if we have at least one meaningful field
              if (Object.keys(logData).length > 0) {
                console.error('API Error:', logData);
              } else {
                // Fallback: log the original error structure
                console.error('API Error:', err);
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

  // Ensure we have a valid message to show
  const messageToShow = errorMessage || defaultMessage;

  if (showToast && messageToShow) {
    toast.error(messageToShow);
  }

  return messageToShow;
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


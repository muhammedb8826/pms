import { toast } from 'sonner';

/**
 * API Error Response Types
 * Based on backend documentation:
 * - Actual format: { statusCode, message: { message, error, statusCode } }
 * - Documented format: { success: false, message: string | string[], error: { code, details } }
 */
type ApiErrorData = {
  // Actual API format (current implementation)
  statusCode?: number;
  message?: string | string[] | { message?: string; error?: string; statusCode?: number };
  // Documented API format
  success?: boolean;
  error?: {
    code?: string;
    details?: string;
    field?: string;
  };
};

type RTKQueryError = {
  data?: ApiErrorData;
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
    case 'CONFLICT':
      return 'This resource already exists or conflicts with existing data';
    case 404:
    case 'NOT_FOUND':
      return 'Resource not found';
    case 400:
    case 'BAD_REQUEST':
      return 'Invalid data provided. Please check all fields.';
    case 422:
    case 'VALIDATION_ERROR':
      return 'Validation failed. Please check your input.';
    case 401:
    case 'UNAUTHORIZED':
      return 'Authentication required. Please log in.';
    case 403:
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    case 500:
    case 'INTERNAL_ERROR':
      return 'An internal server error occurred. Please try again later.';
    default:
      return typeof code === 'number'
        ? `Operation failed (${code})`
        : `Operation failed: ${code}`;
  }
}

/**
 * Extract error message from RTK Query error structure
 * Handles both actual and documented API error formats
 */
export function extractErrorMessage(err: unknown): string {
  let errorMessage = 'Operation failed';

  if (!err) return errorMessage;

  const errorObj = err as RTKQueryError;
  const errorData = errorObj.data || (err as ApiErrorData);

        // Try various error message paths (in order of priority)
        const candidates: (string | undefined)[] = [
          // Priority 1: Actual API format - nested message.message
          // Format: { statusCode: 409, message: { message: "...", error: "...", statusCode: 409 } }
          errorData?.message &&
          typeof errorData.message === 'object' &&
          !Array.isArray(errorData.message) &&
          'message' in errorData.message
            ? extractMessage((errorData.message as { message?: unknown }).message)
            : undefined,
          // Priority 2: Documented API format - direct message string or array
          // Format: { success: false, message: "..." or ["...", "..."] }
          extractMessage(errorData?.message),
          // Priority 3: Documented API format - error.details
          // Format: { success: false, error: { details: "..." } }
          errorData?.error?.details,
          // Priority 4: Top-level message
          errorObj.message,
        ];

  const firstString = candidates.find((c) => typeof c === 'string');
  if (firstString) {
    errorMessage = firstString;
  } else {
    // Fallback to status code/error code messages
    const statusCode = errorObj.status || errorData?.statusCode;
    const errorCode = errorData?.error?.code;
    const code = errorCode || statusCode;

    if (code) {
      errorMessage = getErrorMessageFromCode(code);
    }
  }

  return errorMessage;
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


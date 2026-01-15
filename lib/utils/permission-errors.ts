/**
 * Utilities for handling permission-related errors
 */

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

/**
 * Check if an error is a permission error (403 Forbidden)
 */
export function isPermissionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as FetchBaseQueryError | { status?: number; data?: unknown };
  
  // Check status code
  if (err.status === 403) {
    return true;
  }

  // Check error data for permission indicators
  if (err.data && typeof err.data === 'object') {
    const data = err.data as { statusCode?: number; errorCode?: string; isPermissionError?: boolean };
    if (data.statusCode === 403 || data.errorCode === 'FORBIDDEN' || data.isPermissionError) {
      return true;
    }
  }

  return false;
}

/**
 * Get a user-friendly message for permission errors
 */
export function getPermissionErrorMessage(endpoint?: string): string {
  // Try to extract resource name from endpoint
  if (endpoint) {
    const resourceMatch = endpoint.match(/\/([^/]+)(?:\?|$)/);
    if (resourceMatch) {
      const resource = resourceMatch[1];
      // Convert plural to singular and capitalize
      const resourceName = resource
        .replace(/s$/, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return `You don't have permission to access ${resourceName}. Please contact your administrator.`;
    }
  }
  
  return 'You do not have permission to perform this action. Please contact your administrator.';
}

/**
 * Check if we should suppress error toast for permission errors
 * Generally, we suppress toasts for GET requests (queries) but show them for mutations
 */
export function shouldSuppressPermissionErrorToast(
  error: unknown,
  isMutation: boolean = false
): boolean {
  if (!isPermissionError(error)) {
    return false;
  }

  // For queries (GET requests), suppress the toast - let the component show empty state
  // For mutations (POST/PATCH/DELETE), show the toast so user knows the action failed
  return !isMutation;
}

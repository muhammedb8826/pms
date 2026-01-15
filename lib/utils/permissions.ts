/**
 * Permission utility functions for checking user permissions
 */

/**
 * Check if user has a specific permission or any of the required permissions
 * @param userPermissions - Array of permission codes the user has
 * @param required - Single permission code or array of permission codes
 * @param requireAll - If true, user must have ALL permissions. If false (default), user needs ANY permission
 * @returns true if user has the required permission(s)
 */
export function hasPermission(
  userPermissions: string[],
  required: string | string[],
  requireAll: boolean = false
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  const requiredList = Array.isArray(required) ? required : [required];

  if (requireAll) {
    // User must have ALL permissions
    return requiredList.every((code) => userPermissions.includes(code));
  } else {
    // User needs ANY permission
    return requiredList.some((code) => userPermissions.includes(code));
  }
}

/**
 * Check if user has any of the specified permissions (alias for hasPermission with requireAll=false)
 */
export function hasAnyPermission(
  userPermissions: string[],
  required: string | string[]
): boolean {
  return hasPermission(userPermissions, required, false);
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  required: string | string[]
): boolean {
  return hasPermission(userPermissions, required, true);
}

/**
 * Check if user is an ADMIN (admins bypass all permission checks)
 */
export function isAdmin(userRole?: string | null): boolean {
  return userRole === 'ADMIN';
}

/**
 * Check if user can perform an action based on role and permissions
 * Admins always return true
 */
export function canPerformAction(
  userRole: string | null | undefined,
  userPermissions: string[],
  requiredPermission: string | string[]
): boolean {
  // Admins bypass all permission checks
  if (isAdmin(userRole)) {
    return true;
  }

  return hasPermission(userPermissions, requiredPermission);
}

/**
 * Filter items based on permissions
 * Returns items that the user has permission to access
 */
export function filterByPermission<T extends { requiredPermission?: string | string[] }>(
  items: T[],
  userRole: string | null | undefined,
  userPermissions: string[]
): T[] {
  return items.filter((item) => {
    if (!item.requiredPermission) {
      return true; // No permission required
    }
    return canPerformAction(userRole, userPermissions, item.requiredPermission);
  });
}

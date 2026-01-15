# Permissions System Implementation Guide

This document describes how to use the permissions system in the frontend application.

## Overview

The permissions system provides fine-grained access control based on permission codes. Users are assigned permission codes that determine what operations they can perform. **ADMIN users bypass all permission checks** and have full access.

## Key Components

### 1. Permission Utilities (`lib/utils/permissions.ts`)

Utility functions for checking permissions:

```typescript
import { hasPermission, canPerformAction, isAdmin } from '@/lib/utils/permissions';

// Check if user has a permission
hasPermission(userPermissions, 'sales.create');

// Check if user has any of the permissions
hasPermission(userPermissions, ['sales.create', 'sales.read'], false);

// Check if user has all permissions
hasPermission(userPermissions, ['sales.create', 'sales.read'], true);

// Check if user is admin
isAdmin(userRole);

// Check if user can perform action (admins bypass)
canPerformAction(userRole, userPermissions, 'sales.create');
```

### 2. Permission Constants (`lib/constants/permissions.ts`)

All permission codes are defined as constants:

```typescript
import { PERMISSIONS } from '@/lib/constants/permissions';

// Use permission codes
PERMISSIONS.SALES_CREATE
PERMISSIONS.PRODUCTS_READ
PERMISSIONS.USERS_DELETE
```

### 3. Hooks

#### `useHasPermission` (`hooks/useHasPermission.ts`)

Check if current user has a permission:

```typescript
import { useHasPermission } from '@/hooks/useHasPermission';
import { PERMISSIONS } from '@/lib/constants/permissions';

function MyComponent() {
  const canCreate = useHasPermission(PERMISSIONS.SALES_CREATE);
  const canReadOrUpdate = useHasPermission([
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_UPDATE
  ], false); // false = ANY permission
  
  if (!canCreate) {
    return <div>No permission</div>;
  }
  
  return <button>Create Sale</button>;
}
```

#### `useCurrentUserPermissions` (`features/permission/hooks/usePermissions.ts`)

Get current user's permission codes:

```typescript
import { useCurrentUserPermissions } from '@/features/permission/hooks/usePermissions';

function MyComponent() {
  const { codes, isLoading } = useCurrentUserPermissions();
  
  // codes is string[] of permission codes
  // e.g. ['sales.create', 'sales.read', 'products.read']
}
```

### 4. Components

#### `PermissionGuard` (`components/PermissionGuard.tsx`)

Conditionally render content based on permissions:

```typescript
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/constants/permissions';

function MyComponent() {
  return (
    <>
      <PermissionGuard requiredPermission={PERMISSIONS.SALES_CREATE}>
        <button>Create Sale</button>
      </PermissionGuard>
      
      <PermissionGuard 
        requiredPermission={[PERMISSIONS.SALES_READ, PERMISSIONS.SALES_UPDATE]}
        requireAll={false}
        fallback={<div>No access</div>}
      >
        <SalesList />
      </PermissionGuard>
    </>
  );
}
```

#### `ProtectedRoute` (Updated)

Route protection with permissions:

```typescript
import ProtectedRoute from '@/components/ProtectedRoute';
import { PERMISSIONS } from '@/lib/constants/permissions';

// Protect route with permission
<ProtectedRoute requiredPermission={PERMISSIONS.SALES_READ}>
  <SalesPage />
</ProtectedRoute>

// Protect route with role (existing)
<ProtectedRoute requiredRoles={['ADMIN', 'PHARMACIST']}>
  <AdminPage />
</ProtectedRoute>

// Combine role and permission
<ProtectedRoute 
  requiredRoles={['ADMIN']}
  requiredPermission={PERMISSIONS.USERS_CREATE}
>
  <CreateUserPage />
</ProtectedRoute>
```

## Usage Examples

### Example 1: Show/Hide Button

```typescript
import { useHasPermission } from '@/hooks/useHasPermission';
import { PERMISSIONS } from '@/lib/constants/permissions';

function ProductsPage() {
  const canCreate = useHasPermission(PERMISSIONS.PRODUCTS_CREATE);
  const canDelete = useHasPermission(PERMISSIONS.PRODUCTS_DELETE);
  
  return (
    <div>
      {canCreate && (
        <button onClick={handleCreate}>Create Product</button>
      )}
      {canDelete && (
        <button onClick={handleDelete}>Delete</button>
      )}
    </div>
  );
}
```

### Example 2: Conditional Menu Items

```typescript
import { useHasPermission } from '@/hooks/useHasPermission';
import { PERMISSIONS } from '@/lib/constants/permissions';

function Sidebar() {
  const canViewReports = useHasPermission([
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_FINANCIAL,
    PERMISSIONS.REPORTS_INVENTORY
  ], false); // Show if user has ANY report permission
  
  return (
    <nav>
      <Link href="/products">Products</Link>
      {canViewReports && (
        <Link href="/reports">Reports</Link>
      )}
    </nav>
  );
}
```

### Example 3: Route Protection

```typescript
// app/(dashboard)/users/page.tsx
import ProtectedRoute from '@/components/ProtectedRoute';
import { PERMISSIONS } from '@/lib/constants/permissions';

export default function UsersPage() {
  return (
    <ProtectedRoute 
      requiredRoles={['ADMIN']}
      requiredPermission={PERMISSIONS.USERS_READ}
    >
      <UsersList />
    </ProtectedRoute>
  );
}
```

### Example 4: Table Actions

```typescript
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/constants/permissions';

function ProductTable({ product }) {
  return (
    <tr>
      <td>{product.name}</td>
      <td>
        <PermissionGuard requiredPermission={PERMISSIONS.PRODUCTS_UPDATE}>
          <button>Edit</button>
        </PermissionGuard>
        <PermissionGuard requiredPermission={PERMISSIONS.PRODUCTS_DELETE}>
          <button>Delete</button>
        </PermissionGuard>
      </td>
    </tr>
  );
}
```

## API Endpoints

The permission API is already set up in `features/permission/api/permissionApi.ts`:

- `GET /api/permissions` - Get all permissions
- `GET /api/permissions/me` - Get current user's permissions
- `GET /api/permissions/users/:userId` - Get user's permissions (admin only)
- `POST /api/permissions/users/:userId` - Add permissions to user (merge)
- `PATCH /api/permissions/users/:userId` - Replace user's permissions (set)
- `DELETE /api/permissions/users/:userId/:code` - Remove permission from user
- `POST /api/permissions` - Create permission code
- `DELETE /api/permissions/:id` - Delete permission code

## Important Notes

1. **ADMIN Role**: Users with `ADMIN` role bypass all permission checks and have full access.

2. **Permission Fetching**: Permissions are automatically fetched when using `useCurrentUserPermissions()` or `useHasPermission()`. The hook handles loading states.

3. **Caching**: Permissions are cached by RTK Query and automatically invalidated when updated.

4. **Combining Role and Permission Checks**: You can use both `requiredRoles` and `requiredPermission` in `ProtectedRoute` for maximum security.

5. **Permission Codes**: Always use constants from `PERMISSIONS` object instead of hardcoding strings.

## Best Practices

1. **Use Permission Constants**: Always import and use `PERMISSIONS` constants instead of hardcoding strings.

2. **Check Permissions Early**: Check permissions at the route level when possible to prevent unnecessary rendering.

3. **Provide Fallbacks**: Use `fallback` prop in `PermissionGuard` to show appropriate messages when users lack permissions.

4. **Combine Checks**: For sensitive operations, combine role checks (coarse-grained) with permission checks (fine-grained).

5. **Cache Considerations**: Permissions are cached, so changes may take a moment to reflect. Use `refetch` if needed.

## Migration Guide

To migrate existing code to use permissions:

1. Replace role-only checks with permission checks where appropriate
2. Use `useHasPermission` instead of checking `user.role` directly
3. Wrap protected content with `PermissionGuard` or use `ProtectedRoute` with `requiredPermission`
4. Import permission constants from `@/lib/constants/permissions`

Example migration:

```typescript
// Before
if (user?.role === 'ADMIN' || user?.role === 'PHARMACIST') {
  return <button>Create Sale</button>;
}

// After
const canCreate = useHasPermission(PERMISSIONS.SALES_CREATE);
if (canCreate) {
  return <button>Create Sale</button>;
}
```

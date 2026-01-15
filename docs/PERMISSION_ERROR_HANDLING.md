# Handling Permission Errors (403 Forbidden)

This guide explains how to handle 403 Forbidden errors gracefully in the frontend when users don't have the required permissions.

## Overview

When the backend returns a 403 error, it means the user doesn't have the required permission to access a resource. The frontend should handle these errors gracefully by:

1. **Suppressing noisy error toasts** for queries (GET requests) - let components show empty states
2. **Showing error toasts** for mutations (POST/PATCH/DELETE) - user needs to know the action failed
3. **Displaying appropriate UI** when permissions are missing

## Automatic Handling

The error handling system automatically:

- **Suppresses toasts for GET requests** (queries) that fail due to permissions
- **Shows toasts for mutations** (POST/PATCH/DELETE) that fail due to permissions
- **Marks permission errors** so components can detect them

## Component-Level Handling

### Option 1: Use Permission Checks Before Fetching

The best approach is to check permissions **before** making API calls:

```typescript
import { useHasPermission } from '@/hooks/useHasPermission';
import { PERMISSIONS } from '@/lib/constants/permissions';

function ProductsPage() {
  const canRead = useHasPermission(PERMISSIONS.PRODUCTS_READ);
  const { data, isLoading, error } = useGetProductsQuery(
    { page: 1, limit: 10 },
    { skip: !canRead } // Skip query if no permission
  );

  if (!canRead) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>You don't have permission to view products.</p>
        <p className="text-sm mt-2">Please contact your administrator.</p>
      </div>
    );
  }

  // ... rest of component
}
```

### Option 2: Handle Permission Errors in Query Results

Handle permission errors from API responses:

```typescript
import { isPermissionError } from '@/lib/utils/permission-errors';

function ProductsPage() {
  const { data, isLoading, error } = useGetProductsQuery({ page: 1, limit: 10 });

  if (error && isPermissionError(error)) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>You don't have permission to view products.</p>
        <p className="text-sm mt-2">Please contact your administrator.</p>
      </div>
    );
  }

  // ... rest of component
}
```

### Option 3: Use PermissionErrorBoundary Component

Wrap content with `PermissionErrorBoundary`:

```typescript
import { PermissionErrorBoundary } from '@/components/PermissionErrorBoundary';
import { PERMISSIONS } from '@/lib/constants/permissions';

function ProductsPage() {
  return (
    <PermissionErrorBoundary requiredPermission={PERMISSIONS.PRODUCTS_READ}>
      <ProductsList />
    </PermissionErrorBoundary>
  );
}
```

## Handling Mutations

For mutations (create/update/delete), always show error messages:

```typescript
import { handleApiError } from '@/lib/utils/api-error-handler';

async function handleCreate() {
  try {
    await createProduct.mutateAsync(data);
    toast.success('Product created');
  } catch (err) {
    // This will show a toast for permission errors
    handleApiError(err, { isMutation: true });
  }
}
```

## Best Practices

### 1. Check Permissions Early

Check permissions before rendering or fetching data:

```typescript
// ✅ Good - Check before query
const canRead = useHasPermission(PERMISSIONS.PRODUCTS_READ);
const { data } = useGetProductsQuery({}, { skip: !canRead });

// ❌ Bad - Query always runs, then handle error
const { data, error } = useGetProductsQuery({});
if (error && isPermissionError(error)) { ... }
```

### 2. Show Appropriate Empty States

When users lack permissions, show helpful messages:

```typescript
if (!canRead) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        Access Restricted
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        You don't have permission to view this content.
      </p>
    </div>
  );
}
```

### 3. Hide UI Elements Instead of Showing Errors

Hide buttons/actions that require permissions:

```typescript
// ✅ Good - Hide button if no permission
{canCreate && <button onClick={handleCreate}>Create</button>}

// ❌ Bad - Show button, then show error on click
<button onClick={handleCreate}>Create</button>
// Then handle error in catch block
```

### 4. Use PermissionGuard for Conditional Rendering

```typescript
import { PermissionGuard } from '@/components/PermissionGuard';

<PermissionGuard requiredPermission={PERMISSIONS.PRODUCTS_CREATE}>
  <button>Create Product</button>
</PermissionGuard>
```

## Common Patterns

### Pattern 1: Protected Page with Permission Check

```typescript
function ProductsPage() {
  const canRead = useHasPermission(PERMISSIONS.PRODUCTS_READ);
  const canCreate = useHasPermission(PERMISSIONS.PRODUCTS_CREATE);
  
  const { data, isLoading } = useGetProductsQuery(
    { page: 1, limit: 10 },
    { skip: !canRead }
  );

  if (!canRead) {
    return <PermissionErrorBoundary requiredPermission={PERMISSIONS.PRODUCTS_READ} />;
  }

  return (
    <div>
      {canCreate && <button>Create Product</button>}
      <ProductsList data={data} />
    </div>
  );
}
```

### Pattern 2: Table with Conditional Actions

```typescript
function ProductsTable({ products }) {
  const canUpdate = useHasPermission(PERMISSIONS.PRODUCTS_UPDATE);
  const canDelete = useHasPermission(PERMISSIONS.PRODUCTS_DELETE);

  return (
    <table>
      {products.map(product => (
        <tr key={product.id}>
          <td>{product.name}</td>
          <td>
            {canUpdate && <button>Edit</button>}
            {canDelete && <button>Delete</button>}
          </td>
        </tr>
      ))}
    </table>
  );
}
```

### Pattern 3: Handling Permission Errors in Forms

```typescript
async function handleSubmit(data: CreateProductDto) {
  try {
    await createProduct.mutateAsync(data);
    toast.success('Product created');
  } catch (err) {
    if (isPermissionError(err)) {
      // Show specific permission error
      toast.error('You do not have permission to create products.');
    } else {
      // Show other errors
      handleApiError(err, { isMutation: true });
    }
  }
}
```

## Error Suppression Rules

The system automatically suppresses error toasts for:

- ✅ **GET requests** (queries) that fail with 403
- ❌ **POST/PATCH/DELETE requests** (mutations) that fail with 403 - these show toasts

This prevents noisy error messages when users navigate to pages they can't access, while still informing them when actions fail.

## Testing Permission Errors

To test permission error handling:

1. **Create a test user** without the required permissions
2. **Log in as that user**
3. **Navigate to protected pages** - should show empty states, not error toasts
4. **Try to perform actions** - should show error toasts for mutations

## Summary

- ✅ Check permissions **before** making API calls when possible
- ✅ Use `skip` option in RTK Query to prevent unnecessary requests
- ✅ Show helpful empty states instead of error messages for queries
- ✅ Show error toasts for mutations that fail due to permissions
- ✅ Hide UI elements that require permissions instead of showing errors
- ✅ Use `PermissionErrorBoundary` or `PermissionGuard` for conditional rendering

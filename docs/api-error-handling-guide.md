# API Error Handling Guide

This guide explains how to handle API errors and success messages consistently across all modules in the application.

## Overview

The application uses a **global error handling utility** that follows the backend API documentation for error and success responses. This ensures consistent error handling across all CRUD operations (Products, Categories, Manufacturers, Suppliers, Purchases, UOMs, Unit Categories, etc.).

## Features

✅ **Automatic Error Message Extraction** - Handles both actual and documented API error formats  
✅ **Consistent Toast Notifications** - Shows user-friendly error and success messages  
✅ **Type-Safe** - Full TypeScript support  
✅ **Reusable** - Works for all modules and CRUD operations  

## API Response Formats

### Error Response Formats

The backend returns errors in two formats (both are handled automatically):

**Actual Format (Current Implementation):**
```json
{
  "statusCode": 409,
  "timestamp": "2025-11-02T14:00:00.000Z",
  "path": "/api/v1/purchases",
  "message": {
    "message": "Purchase with invoice number \"INV-001\" already exists for this supplier",
    "error": "Conflict",
    "statusCode": 409
  }
}
```

**Documented Format:**
```json
{
  "success": false,
  "message": "Error message here",
  "timestamp": "2025-11-02T14:00:00.000Z",
  "path": "/api/v1/purchases",
  "error": {
    "code": "CONFLICT",
    "details": "Additional error details (optional)",
    "field": "Field name for validation errors (optional)"
  }
}
```

### Success Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2025-11-02T14:00:00.000Z"
}
```

## Usage

### Basic Error Handling

Import the utility functions:

```typescript
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';
```

### In Form Submit Handlers

**Example: Create/Update Operation**

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  
  try {
    if (item) {
      // Update operation
      await updateMutation.mutateAsync({ id: item.id, dto: formData });
      handleApiSuccess('Item updated successfully');
    } else {
      // Create operation
      await createMutation.mutateAsync(formData);
      handleApiSuccess('Item created successfully');
    }
    
    onSuccess(); // Callback to close modal, redirect, etc.
  } catch (err: unknown) {
    // Global error handler automatically:
    // - Extracts error message from API response
    // - Shows error toast notification
    // - Returns the error message for form display
    const errorMessage = handleApiError(err, {
      defaultMessage: 'Failed to save item',
    });
    
    // Set form error state
    setErrors((prev) => ({ ...prev, form: errorMessage }));
    onErrorChange?.(errorMessage);
  }
}
```

### In Delete Operations

```typescript
async function handleDelete(id: string) {
  try {
    await deleteMutation.mutateAsync(id);
    handleApiSuccess('Item deleted successfully');
    refetch(); // Refresh the list
  } catch (err: unknown) {
    handleApiError(err, {
      defaultMessage: 'Failed to delete item',
    });
  }
}
```

### Custom Options

You can customize the behavior:

```typescript
// Disable toast (e.g., if you want to show error differently)
const errorMessage = handleApiError(err, {
  defaultMessage: 'Custom default message',
  showToast: false, // Don't show toast
  logError: false, // Don't log to console
});

// Disable success toast (rare case)
handleApiSuccess('Item saved', { showToast: false });
```

### Extract Error Without Toast

If you need the error message but don't want to show a toast:

```typescript
import { extractFormError } from '@/lib/utils/api-error-handler';

const errorMessage = extractFormError(err);
// Use errorMessage for form validation display
```

## Error Message Priority

The error handler extracts messages in this priority order:

1. **Nested message.message** - `message.message` from actual API format
2. **Direct message** - `message` string or first item in array
3. **Error details** - `error.details` from documented format
4. **Error message** - `error.message`
5. **Top-level message** - Top-level `message` field
6. **Status code fallback** - User-friendly message based on status/error code

## Status Code Messages

The handler provides user-friendly messages for common status codes:

| Code | Message |
|------|---------|
| 409 / CONFLICT | "This resource already exists or conflicts with existing data" |
| 404 / NOT_FOUND | "Resource not found" |
| 400 / BAD_REQUEST | "Invalid data provided. Please check all fields." |
| 422 / VALIDATION_ERROR | "Validation failed. Please check your input." |
| 401 / UNAUTHORIZED | "Authentication required. Please log in." |
| 403 / FORBIDDEN | "You do not have permission to perform this action." |
| 500 / INTERNAL_ERROR | "An internal server error occurred. Please try again later." |

## Examples for All Modules

### Products

```typescript
try {
  await createProductMutation.mutateAsync(productData);
  handleApiSuccess('Product created successfully');
  router.push('/products');
} catch (err: unknown) {
  const errorMessage = handleApiError(err, {
    defaultMessage: 'Failed to create product',
  });
  setFormError(errorMessage);
}
```

### Categories

```typescript
try {
  await updateCategoryMutation.mutateAsync({ id: category.id, dto: formData });
  handleApiSuccess('Category updated successfully');
  onSuccess();
} catch (err: unknown) {
  handleApiError(err);
}
```

### Suppliers

```typescript
try {
  await deleteSupplierMutation.mutateAsync(supplierId);
  handleApiSuccess('Supplier deleted successfully');
  refetch();
} catch (err: unknown) {
  handleApiError(err, {
    defaultMessage: 'Failed to delete supplier',
  });
}
```

### Unit Categories

```typescript
try {
  await createUnitCategoryMutation.mutateAsync({ name, description });
  handleApiSuccess('Unit category created successfully');
  setDialogOpen(false);
} catch (err: unknown) {
  const errorMessage = handleApiError(err);
  setFormError(errorMessage);
}
```

### Unit of Measures (UOMs)

```typescript
try {
  await updateUOMMutation.mutateAsync({ 
    id: uom.id, 
    dto: { name, abbreviation, conversionRate, baseUnit, unitCategoryId } 
  });
  handleApiSuccess('Unit of measure updated successfully');
  refetch();
} catch (err: unknown) {
  handleApiError(err);
}
```

## Best Practices

1. ✅ **Always use `handleApiError`** in catch blocks for API operations
2. ✅ **Always use `handleApiSuccess`** after successful mutations
3. ✅ **Provide descriptive default messages** - Helps users understand what went wrong
4. ✅ **Don't manually extract error messages** - The utility handles all formats
5. ✅ **Let the utility show toasts** - Consistent UX across the application
6. ✅ **Use `extractFormError`** only if you need the message without a toast

## Migration Guide

To migrate existing code:

**Before:**
```typescript
import { toast } from 'sonner';

try {
  await mutation.mutateAsync(data);
  toast.success('Success!');
} catch (err: any) {
  const message = err?.data?.message || 'Failed';
  toast.error(message);
}
```

**After:**
```typescript
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

try {
  await mutation.mutateAsync(data);
  handleApiSuccess('Success!');
} catch (err: unknown) {
  handleApiError(err, { defaultMessage: 'Failed' });
}
```

## Troubleshooting

### Toast Not Showing

- Ensure `Toaster` component is in your root layout (check `app/layout.tsx`)
- Check that `showToast` option is not set to `false`

### Error Message Not Extracted

- Check browser console for logged error structure
- The utility handles both actual and documented API formats automatically
- If custom format, you may need to update the utility

### TypeScript Errors

- Use `err: unknown` in catch blocks (not `any`)
- The utility handles type casting internally

## Summary

The global error handling utility:

- ✅ **Works for all modules** - Products, Categories, Manufacturers, Suppliers, Purchases, UOMs, Unit Categories
- ✅ **Follows backend documentation** - Handles both actual and documented response formats
- ✅ **Consistent UX** - Same error/success handling everywhere
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Zero boilerplate** - Simple import and use

Just import and use `handleApiError` and `handleApiSuccess` in your forms!


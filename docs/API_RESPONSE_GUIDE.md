# API Response Type Guide

This guide documents the standardized response format used by the PMS API backend and how to use the TypeScript types and utilities in the frontend.

## Overview

All API endpoints return responses in a consistent structure, making it easy to build reusable response handling on the frontend.

## TypeScript Types

All response types are defined in `types/api-response.ts`:

```typescript
import type {
  SuccessResponse,
  ErrorResponse,
  PaginatedResponse,
  ApiResponse,
  PaginationMeta,
  ErrorCode,
} from '@/types/api-response';
```

### Success Response

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  timestamp: string;
  path?: string;
  error: {
    code: string;
    details?: string;
    field?: string;
  };
}
```

### Paginated Response

```typescript
interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Usage Examples

### Basic Response Handling

```typescript
import { getResponseData, isApiSuccess, isApiError } from '@/lib/utils/api-response';
import type { SuccessResponse, ErrorResponse } from '@/types/api-response';

// In an RTK Query hook result
const { data, error } = useGetProductQuery(id);

if (data) {
  // Unwrap the response data
  const product = getResponseData<Product>(data);
  // or check if it's a success response
  if (isApiSuccess(data)) {
    const product = data.data; // TypeScript knows this is SuccessResponse<Product>
  }
}

if (error) {
  // Check if it's an error response
  if (isApiError(error.data)) {
    console.log(error.data.error.code);
    console.log(error.data.error.details);
  }
}
```

### Paginated Response Handling

```typescript
import {
  getResponseData,
  getPaginationMeta,
  hasNextPage,
  hasPrevPage,
  getCurrentPage,
  getTotalPages,
} from '@/lib/utils/api-response';
import type { PaginatedResponse } from '@/types/api-response';

const { data } = useGetProductsQuery({ page: 1, limit: 10 });

if (data && isPaginatedResponse<Product>(data)) {
  const products = data.data; // Array of products
  const pagination = data.pagination;
  
  // Or use utility functions
  const products = getResponseData<Product[]>(data);
  const currentPage = getCurrentPage(data);
  const totalPages = getTotalPages(data);
  const hasNext = hasNextPage(data);
  const hasPrev = hasPrevPage(data);
}
```

### Error Handling

```typescript
import { handleApiError, extractErrorMessage } from '@/lib/utils/api-error-handler';
import { getErrorCode, getErrorDetails, getErrorField } from '@/lib/utils/api-response';

try {
  await createProduct(productData).unwrap();
} catch (err) {
  // Automatic toast notification
  handleApiError(err);
  
  // Or extract error details manually
  const errorCode = getErrorCode(err);
  const errorDetails = getErrorDetails(err);
  const errorField = getErrorField(err);
  
  // Handle specific error codes
  if (errorCode === 'VALIDATION_ERROR') {
    // Show field-specific validation errors
  } else if (errorCode === 'NOT_FOUND') {
    // Handle not found
  }
}
```

### Type Guards

```typescript
import {
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse,
} from '@/types/api-response';

function handleResponse(response: unknown) {
  if (isSuccessResponse<Product>(response)) {
    // TypeScript knows response is SuccessResponse<Product>
    console.log(response.data);
  } else if (isErrorResponse(response)) {
    // TypeScript knows response is ErrorResponse
    console.log(response.error.code);
  }
  
  if (isPaginatedResponse<Product>(response)) {
    // TypeScript knows response is PaginatedResponse<Product>
    console.log(response.data);
    console.log(response.pagination);
  }
}
```

## Error Codes

Standard error codes are available as an enum:

```typescript
import { ErrorCode } from '@/types/api-response';

switch (errorCode) {
  case ErrorCode.VALIDATION_ERROR:
    // Handle validation error
    break;
  case ErrorCode.NOT_FOUND:
    // Handle not found
    break;
  case ErrorCode.UNAUTHORIZED:
    // Redirect to login
    break;
  // ... etc
}
```

## RTK Query Integration

RTK Query automatically handles response unwrapping in most cases, but you can use these utilities for additional type safety:

```typescript
// In a custom hook
export function useProduct(id: string) {
  const query = useGetProductQuery(id);
  
  const product = useMemo(() => {
    return getResponseData<Product>(query.data);
  }, [query.data]);
  
  return {
    product,
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

## Backward Compatibility

The utilities handle both the new standardized format and legacy formats for backward compatibility. The `unwrapResponseData` function will work with:

- Standardized format: `{ success: true, data: T }`
- Unwrapped format: `T` (direct data)
- Legacy wrapped format: `{ data: T }`

## Best Practices

1. **Always check `success` field first** before accessing `data` or `error`
2. **Use type guards** (`isSuccessResponse`, `isErrorResponse`) for type safety
3. **Use utility functions** from `lib/utils/api-response` for common operations
4. **Handle error codes** using the `ErrorCode` enum for consistent error handling
5. **Use TypeScript generics** to type your responses: `SuccessResponse<Product>`

## See Also

- `types/api-response.ts` - Type definitions
- `lib/utils/api-response.ts` - Utility functions
- `lib/utils/api-error-handler.ts` - Error handling utilities


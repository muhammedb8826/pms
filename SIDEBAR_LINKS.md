# Sidebar Links & Required Permissions

This document lists all sidebar navigation links and the permissions required to view them.

## Main Navigation (navMain)

### 1. Dashboard
- **URL**: `/dashboard`
- **Required Permission**: `dashboard.view`
- **Type**: Single link (no sub-items)

### 2. Inventory (Collapsible)
- **URL**: `#` (collapsible section)
- **Shows if user has ANY of the following sub-items:**
  - **Products** (`/products`)
    - Required: Any of `products.read`, `products.create`, `products.update`, `products.delete`, `products.import`
  - **Batches** (`/batches`)
    - Required: Any of `batches.read`, `batches.create`, `batches.update`, `batches.delete`
  - **Categories** (`/categories`)
    - Required: Any of `categories.read`, `categories.create`, `categories.update`, `categories.delete`
  - **Manufacturers** (`/manufacturers`)
    - Required: Any of `manufacturers.read`, `manufacturers.create`, `manufacturers.update`, `manufacturers.delete`

### 3. Operations (Collapsible)
- **URL**: `#` (collapsible section)
- **Shows if user has ANY of the following sub-items:**
  - **Quotations** (`/quotations`)
    - Required: Any of `quotations.read`, `quotations.create`, `quotations.update`, `quotations.delete`, `quotations.accept`
  - **Sales** (`/sales`)
    - Required: Any of `sales.read`, `sales.create`, `sales.update`, `sales.delete`
  - **Purchases** (`/purchases`)
    - Required: Any of `purchases.read`, `purchases.create`, `purchases.update`, `purchases.delete`
  - **Requisition** (`/requisition`)
    - Required: Any of `purchases.read`, `purchases.create`, `products.read`

### 4. Customers & Partners (Collapsible)
- **URL**: `#` (collapsible section)
- **Shows if user has ANY of the following sub-items:**
  - **Customers** (`/customers`)
    - Required: Any of `customers.read`, `customers.create`, `customers.update`, `customers.delete`
  - **Suppliers** (`/suppliers`)
    - Required: Any of `suppliers.read`, `suppliers.create`, `suppliers.update`, `suppliers.delete`
  - **Users** (`/users`)
    - Required: Any of `users.read`, `users.create`, `users.update`, `users.delete`

### 5. Finance (Collapsible)
- **URL**: `#` (collapsible section)
- **Shows if user has ANY of the following sub-items:**
  - **Payment History** (`/payments`)
    - Required: Any of `payments.read`, `payments.delete`
  - **Payment Methods** (`/payment-methods`)
    - Required: Any of `paymentMethods.read`, `paymentMethods.create`, `paymentMethods.update`, `paymentMethods.delete`
  - **Credits** (`/credits`)
    - Required: Any of `credits.read`, `credits.create`, `credits.update`, `credits.delete`, `credits.pay`
  - **Commissions** (`/commissions`)
    - Required: Any of `commissions.read`, `commissions.create`, `commissions.update`, `commissions.delete`, `commissions.pay`

## Secondary Navigation (navSecondary)

### 1. Notifications
- **URL**: `/notifications`
- **Required Permission**: Any of `notifications.read`, `notifications.create`, `notifications.update`, `notifications.delete`
- **Type**: Single link (no sub-items)

### 2. Settings (Collapsible)
- **URL**: `#` (collapsible section)
- **Shows if user has ANY of the following sub-items:**
  - **Pharmacy Settings** (`/settings/pharmacy`)
    - Required: Any of `settings.read`, `settings.update`
  - **Unit Categories** (`/settings/unit-categories`)
    - Required: Any of `unitCategories.read`, `unitCategories.create`, `unitCategories.update`, `unitCategories.delete`
  - **Units of Measure** (`/settings/uom`)
    - Required: Any of `uoms.read`, `uoms.create`, `uoms.update`, `uoms.delete`
  - **Commission Configs** (`/commission-configs`)
    - Required: Any of `commissionConfigs.read`, `commissionConfigs.create`, `commissionConfigs.update`, `commissionConfigs.delete`

### 3. Get Help
- **URL**: `#`
- **Required Permission**: None (always visible)
- **Type**: Single link (no sub-items)

### 4. Search
- **URL**: `#`
- **Required Permission**: None (always visible)
- **Type**: Single link (no sub-items)

## Documents Section

### 1. Reports
- **URL**: `/reports`
- **Required Permission**: Any of `reports.sales`, `reports.purchases`, `reports.inventory`, `reports.financial`, `reports.commissions`, `reports.products`
- **Type**: Single link (no sub-items)

## Permission Logic Summary

### For Admins
- **ADMIN role** bypasses all permission checks
- All links are visible regardless of assigned permissions

### For Non-Admins
- **Collapsible sections** (Inventory, Operations, Customers & Partners, Finance, Settings):
  - Section is visible if user has at least one CRUD permission for **ANY** sub-item
  - Each sub-item is individually filtered based on its specific permissions
  - If a user only has `products.read`, they will see:
    - The "Inventory" section (because Products has permissions)
    - Only "Products" link inside it (Batches, Categories, Manufacturers will be hidden)

- **Single links** (Dashboard, Notifications, Reports):
  - Visible only if user has the required permission(s)

- **Always visible**:
  - Get Help
  - Search

### Fallback Behavior
- If permissions cannot be loaded (`permissionsLoaded === false`):
  - Shows minimal safe navigation:
    - Dashboard (always)
    - Customers & Partners section (without Users sub-item)

## Example Scenarios

### Scenario 1: User with only `products.read`
**Visible Links:**
- Dashboard (if has `dashboard.view`)
- Inventory → Products only
- All other sections hidden

### Scenario 2: User with `sales.read` and `customers.read`
**Visible Links:**
- Dashboard (if has `dashboard.view`)
- Operations → Sales only
- Customers & Partners → Customers only
- All other sections hidden

### Scenario 3: User with `products.read`, `batches.read`, `categories.read`, `manufacturers.read`
**Visible Links:**
- Dashboard (if has `dashboard.view`)
- Inventory → Products, Batches, Categories, Manufacturers (all visible)
- All other sections hidden


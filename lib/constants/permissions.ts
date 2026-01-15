/**
 * Permission codes used throughout the application
 * These match the permission codes defined in the backend
 */

// System & Admin
export const PERMISSIONS = {
  // Permissions Management
  PERMISSIONS_MANAGE: 'permissions.manage',
  
  // Users
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  
  // Master Data - Categories
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_UPDATE: 'categories.update',
  CATEGORIES_DELETE: 'categories.delete',
  
  // Master Data - Manufacturers
  MANUFACTURERS_READ: 'manufacturers.read',
  MANUFACTURERS_CREATE: 'manufacturers.create',
  MANUFACTURERS_UPDATE: 'manufacturers.update',
  MANUFACTURERS_DELETE: 'manufacturers.delete',
  
  // Master Data - Products
  PRODUCTS_READ: 'products.read',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_IMPORT: 'products.import',
  
  // Master Data - UOMs
  UOMS_READ: 'uoms.read',
  UOMS_CREATE: 'uoms.create',
  UOMS_UPDATE: 'uoms.update',
  UOMS_DELETE: 'uoms.delete',
  
  // Master Data - Unit Categories
  UNIT_CATEGORIES_READ: 'unitCategories.read',
  UNIT_CATEGORIES_CREATE: 'unitCategories.create',
  UNIT_CATEGORIES_UPDATE: 'unitCategories.update',
  UNIT_CATEGORIES_DELETE: 'unitCategories.delete',
  
  // Inventory & Batches
  BATCHES_READ: 'batches.read',
  BATCHES_CREATE: 'batches.create',
  BATCHES_UPDATE: 'batches.update',
  BATCHES_DELETE: 'batches.delete',
  
  // Customers
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',
  
  // Suppliers
  SUPPLIERS_READ: 'suppliers.read',
  SUPPLIERS_CREATE: 'suppliers.create',
  SUPPLIERS_UPDATE: 'suppliers.update',
  SUPPLIERS_DELETE: 'suppliers.delete',
  
  // Sales
  SALES_READ: 'sales.read',
  SALES_CREATE: 'sales.create',
  SALES_UPDATE: 'sales.update',
  SALES_DELETE: 'sales.delete',
  
  // Sale Items
  SALE_ITEMS_READ: 'saleItems.read',
  SALE_ITEMS_CREATE: 'saleItems.create',
  SALE_ITEMS_UPDATE: 'saleItems.update',
  SALE_ITEMS_DELETE: 'saleItems.delete',
  
  // Purchases
  PURCHASES_READ: 'purchases.read',
  PURCHASES_CREATE: 'purchases.create',
  PURCHASES_UPDATE: 'purchases.update',
  PURCHASES_DELETE: 'purchases.delete',
  
  // Purchase Items
  PURCHASE_ITEMS_READ: 'purchaseItems.read',
  PURCHASE_ITEMS_CREATE: 'purchaseItems.create',
  PURCHASE_ITEMS_UPDATE: 'purchaseItems.update',
  PURCHASE_ITEMS_DELETE: 'purchaseItems.delete',
  
  // Payments
  PAYMENTS_READ: 'payments.read',
  PAYMENTS_DELETE: 'payments.delete',
  
  // Payment Methods
  PAYMENT_METHODS_READ: 'paymentMethods.read',
  PAYMENT_METHODS_CREATE: 'paymentMethods.create',
  PAYMENT_METHODS_UPDATE: 'paymentMethods.update',
  PAYMENT_METHODS_DELETE: 'paymentMethods.delete',
  
  // Credits
  CREDITS_READ: 'credits.read',
  CREDITS_CREATE: 'credits.create',
  CREDITS_UPDATE: 'credits.update',
  CREDITS_DELETE: 'credits.delete',
  CREDITS_PAY: 'credits.pay',
  
  // Commissions
  COMMISSIONS_READ: 'commissions.read',
  COMMISSIONS_CREATE: 'commissions.create',
  COMMISSIONS_UPDATE: 'commissions.update',
  COMMISSIONS_DELETE: 'commissions.delete',
  COMMISSIONS_PAY: 'commissions.pay',
  
  // Commission Configs
  COMMISSION_CONFIGS_READ: 'commissionConfigs.read',
  COMMISSION_CONFIGS_CREATE: 'commissionConfigs.create',
  COMMISSION_CONFIGS_UPDATE: 'commissionConfigs.update',
  COMMISSION_CONFIGS_DELETE: 'commissionConfigs.delete',
  
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Reports
  REPORTS_SALES: 'reports.sales',
  REPORTS_PURCHASES: 'reports.purchases',
  REPORTS_INVENTORY: 'reports.inventory',
  REPORTS_FINANCIAL: 'reports.financial',
  REPORTS_COMMISSIONS: 'reports.commissions',
  REPORTS_PRODUCTS: 'reports.products',
  
  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  
  // Quotations
  QUOTATIONS_READ: 'quotations.read',
  QUOTATIONS_CREATE: 'quotations.create',
  QUOTATIONS_UPDATE: 'quotations.update',
  QUOTATIONS_DELETE: 'quotations.delete',
  QUOTATIONS_ACCEPT: 'quotations.accept',
  
  // Notifications
  NOTIFICATIONS_READ: 'notifications.read',
  NOTIFICATIONS_CREATE: 'notifications.create',
  NOTIFICATIONS_UPDATE: 'notifications.update',
  NOTIFICATIONS_DELETE: 'notifications.delete',
} as const;

/**
 * Helper function to get all permission codes as an array
 */
export function getAllPermissionCodes(): string[] {
  return Object.values(PERMISSIONS);
}

/**
 * Helper function to get permissions by module prefix
 */
export function getPermissionsByModule(prefix: string): string[] {
  return Object.values(PERMISSIONS).filter((code) => code.startsWith(prefix));
}

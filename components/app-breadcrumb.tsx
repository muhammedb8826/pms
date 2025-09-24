"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  LayoutDashboard,
  Pill,
  FolderOpen,
  Truck,
  Users,
  User,
  ShoppingCart,
  BarChart3,
  FileText,
  Package,
  Settings,
  Plus,
  List,
} from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Route configuration for breadcrumbs
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  medicines: "Medicines",
  categories: "Categories",
  suppliers: "Suppliers",
  customers: "Customers",
  users: "Users",
  "purchase-orders": "Purchase Orders",
  sales: "Sales",
  reports: "Reports",
  inventory: "Inventory",
  adjustments: "Adjustments",
  account: "Account",
  create: "Create",
  list: "List",
};

// Icons for breadcrumb items
const routeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  medicines: Pill,
  categories: FolderOpen,
  suppliers: Truck,
  customers: Users,
  users: User,
  "purchase-orders": ShoppingCart,
  sales: BarChart3,
  reports: FileText,
  inventory: Package,
  adjustments: Settings,
  account: User,
  create: Plus,
  list: List,
};

// Special handling for nested routes
const getRouteLabel = (segment: string, context: string[]): string => {
  // Handle purchase orders create page
  if (segment === "create" && context.includes("purchase-orders")) {
    return "Create Order";
  }
  
  // Handle sales list page
  if (segment === "list" && context.includes("sales")) {
    return "Sales History";
  }
  
  // Default to route labels or capitalize
  return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
};

// Get icon for route segment
const getRouteIcon = (segment: string, context: string[]): React.ComponentType<{ className?: string }> | null => {
  // Handle special cases
  if (segment === "create" && context.includes("purchase-orders")) {
    return Plus;
  }
  
  if (segment === "list" && context.includes("sales")) {
    return List;
  }
  
  return routeIcons[segment] || null;
};

export function AppBreadcrumb() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Handle different route patterns
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      // Just dashboard page
      return [{
        label: "Dashboard",
        href: undefined,
      }];
    }

    // Always start with Dashboard for authenticated routes
    if (segments.length > 0 && !pathname.startsWith("/login")) {
      breadcrumbs.push({
        label: "Dashboard",
        href: "/dashboard",
      });
    }

    // Build breadcrumbs from path segments
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip the first segment if it's just "dashboard"
      if (segment === "dashboard" && index === 0) {
        return;
      }

      const label = getRouteLabel(segment, segments);
      const isLast = index === segments.length - 1;
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on login page or if no breadcrumbs
  if (pathname === "/login" || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => {
          const IconComponent = getRouteIcon(
            pathname.split("/").filter(Boolean)[index] || "",
            pathname.split("/").filter(Boolean)
          );
          
          return (
            <div key={index} className="flex items-center">
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

"use client"

import * as React from "react"
import {
  IconBell,
  IconChartBar,
  IconCurrencyDollar,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"
import Image from "next/image"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/features/auth/contexts/AuthContext"
import { usePharmacySettings } from "@/features/settings/hooks/useSettings"
import { useCurrentUserPermissions } from "@/features/permission/hooks/usePermissions"
import { resolveImageUrl } from "@/lib/utils/image-url"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      permissions: ["dashboard.view"],
    },
    {
      title: "Products",
      url: "/products",
      icon: IconFolder,
      permissions: ["products.read", "products.create", "products.update", "products.delete", "products.import"],
    },
    {
      title: "Batches",
      url: "/batches",
      icon: IconFolder,
      permissions: ["batches.read", "batches.create", "batches.update", "batches.delete"],
    },
    {
      title: "Categories",
      url: "/categories",
      icon: IconFolder,
      permissions: ["categories.read", "categories.create", "categories.update", "categories.delete"],
    },
    {
      title: "Manufacturers",
      url: "/manufacturers",
      icon: IconFolder,
      permissions: ["manufacturers.read", "manufacturers.create", "manufacturers.update", "manufacturers.delete"],
    },
    {
      title: "Bin Card",
      url: "/bin-card",
      icon: IconFolder,
      permissions: ["products.read", "products.create", "products.update", "products.delete", "products.import"],
    },
    {
      title: "Requisition",
      url: "/quotations",
      icon: IconChartBar,
      permissions: ["quotations.read", "quotations.create", "quotations.update", "quotations.delete", "quotations.accept"],
    },
    {
      title: "Sales",
      url: "/sales",
      icon: IconChartBar,
      permissions: ["sales.read", "sales.create", "sales.update", "sales.delete"],
    },
    {
      title: "Purchases",
      url: "/purchases",
      icon: IconChartBar,
      permissions: ["purchases.read", "purchases.create", "purchases.update", "purchases.delete"],
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
      permissions: ["customers.read", "customers.create", "customers.update", "customers.delete"],
    },
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: IconUsers,
      permissions: ["suppliers.read", "suppliers.create", "suppliers.update", "suppliers.delete"],
    },
    {
      title: "Users",
      url: "/users",
      icon: IconUsers,
      permissions: ["users.read", "users.create", "users.update", "users.delete"],
    },
    {
      title: "Payment History",
      url: "/payments",
      icon: IconCurrencyDollar,
      permissions: ["payments.read", "payments.delete"],
    },
    {
      title: "Payment Methods",
      url: "/payment-methods",
      icon: IconCurrencyDollar,
      permissions: ["paymentMethods.read", "paymentMethods.create", "paymentMethods.update", "paymentMethods.delete"],
    },
    {
      title: "Credits",
      url: "/credits",
      icon: IconCurrencyDollar,
      permissions: ["credits.read", "credits.create", "credits.update", "credits.delete", "credits.pay"],
    },
    {
      title: "Commissions",
      url: "/commissions",
      icon: IconCurrencyDollar,
      permissions: ["commissions.read", "commissions.create", "commissions.update", "commissions.delete", "commissions.pay"],
    },
  ],
  
  navSecondary: [
    {
      title: "Notifications",
      url: "/notifications",
      icon: IconBell,
      permissions: ["notifications.read", "notifications.create", "notifications.update", "notifications.delete"],
    },
    {
      title: "Pharmacy Settings",
      url: "/settings/pharmacy",
      icon: IconSettings,
      // Any authenticated user can read settings; only users with settings.update
      // should see the Settings page link in the sidebar.
      permissions: ["settings.update"],
    },
    {
      title: "Unit Categories",
      url: "/settings/unit-categories",
      icon: IconSettings,
      permissions: ["unitCategories.read", "unitCategories.create", "unitCategories.update", "unitCategories.delete"],
    },
    {
      title: "Units of Measure",
      url: "/settings/uom",
      icon: IconSettings,
      permissions: ["uoms.read", "uoms.create", "uoms.update", "uoms.delete"],
    },
    {
      title: "Commission Configs",
      url: "/commission-configs",
      icon: IconSettings,
      permissions: ["commissionConfigs.read", "commissionConfigs.create", "commissionConfigs.update", "commissionConfigs.delete"],
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
      permissions: [], // Always visible
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
      permissions: [], // Always visible
    },
  ],
  documents: [
    {
      name: "Reports",
      url: "/reports",
      icon: IconReport,
      permissions: ["reports.sales", "reports.purchases", "reports.inventory", "reports.financial", "reports.commissions", "reports.products"],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { settings } = usePharmacySettings()
  const { codes: permissionCodes, isLoaded: permissionsLoaded, isLoading: permissionsLoading, error: permissionsError } = useCurrentUserPermissions()
  const isAdmin = user?.role === "ADMIN"

  const logoSrc = React.useMemo(() => {
    return resolveImageUrl(settings.pharmacyLogoUrl)
  }, [settings.pharmacyLogoUrl])
  const sidebarUser = user
    ? {
        name: user.email,
        email: user.email,
        avatar: "",
      }
    : data.user

  const normalizedPermissions = React.useMemo(
    () => new Set(permissionCodes.map((c) => c.toLowerCase())),
    [permissionCodes]
  )

  const hasPermission = React.useCallback(
    (required: string | string[]) => {
      if (isAdmin) return true
      const list = Array.isArray(required) ? required : [required]
      const result = list.some((code) => {
        const lower = code.toLowerCase()
        const alt = lower.replace(".", "_")
        const hasLower = normalizedPermissions.has(lower)
        const hasAlt = normalizedPermissions.has(alt)
        if (hasLower || hasAlt) {
          console.log(`[Sidebar] Permission match: "${code}" (checked: "${lower}", "${alt}")`)
        }
        return hasLower || hasAlt
      })
      if (!result) {
        console.log(`[Sidebar] No permission match for:`, list, 'User has:', Array.from(normalizedPermissions))
      }
      return result
    },
    [isAdmin, normalizedPermissions]
  )

  // Debug logging (remove in production)
  React.useEffect(() => {
    if (user) {
      console.log('[Sidebar] User:', user.role, user.email)
      console.log('[Sidebar] Permissions loading:', permissionsLoading)
      console.log('[Sidebar] Permissions loaded:', permissionsLoaded)
      console.log('[Sidebar] Permission codes (raw):', permissionCodes)
      console.log('[Sidebar] Normalized permissions:', Array.from(normalizedPermissions))
      console.log('[Sidebar] Is Admin:', isAdmin)
      if (permissionsError) {
        console.error('[Sidebar] Permission fetch error:', permissionsError)
      }
      if (permissionsLoaded) {
        console.log('[Sidebar] Testing Sales permission:', hasPermission(["sales.read", "sales.create", "sales.update", "sales.delete"]))
        console.log('[Sidebar] Testing Dashboard permission:', hasPermission(["dashboard.view"]))
      }
    }
  }, [permissionsLoaded, permissionsLoading, permissionCodes, normalizedPermissions, user, isAdmin, permissionsError, hasPermission])

  // Helper to build grouped nav items for NavMain while preserving permission filtering.
  const buildNavMainItems = React.useCallback(
    (items: typeof data.navMain) => {
      // Index allowed items by URL for quick lookup
      const byUrl = new Map(items.map((item) => [item.url, item]))

      const makeGroup = (
        title: string,
        icon: (typeof IconDashboard),
        urls: string[]
      ) => {
        const children = urls
          .map((url) => byUrl.get(url))
          .filter(Boolean) as typeof data.navMain

        if (children.length === 0) return null

        // If there is only a single child and its title matches the group title,
        // treat it as a simple direct link (no collapsible group).
        if (children.length === 1 && children[0].title === title) {
          const child = children[0]
          return {
            title: child.title,
            url: child.url,
            icon: child.icon ?? icon,
          }
        }

        return {
          title,
          url: children[0].url,
          icon,
          items: children.map((c) => ({
            title: c.title,
            url: c.url,
          })),
        }
      }

      const groups = [
        // Single dashboard entry
        makeGroup("Dashboard", IconDashboard, ["/dashboard"]),
        // Inventory & products
        makeGroup("Inventory", IconFolder, [
          "/products",
          "/batches",
          "/categories",
          "/manufacturers",
        ]),
        // Sales and requisition (quotation)
        makeGroup("Sales & Requisition", IconChartBar, [
          "/quotations",
          "/sales",
        ]),
        // Purchasing
        makeGroup("Purchasing", IconChartBar, [
          "/purchases",
        ]),
        // People
        makeGroup("People", IconUsers, [
          "/customers",
          "/suppliers",
          "/users",
        ]),
        // Finance
        makeGroup("Finance", IconCurrencyDollar, [
          "/payments",
          "/payment-methods",
          "/credits",
          "/commissions",
        ]),
      ].filter(Boolean) as {
        title: string
        url: string
        icon: typeof IconDashboard
        items?: { title: string; url: string }[]
      }[]

      // Include any allowed items that were not part of the predefined groups
      const groupedUrls = new Set(
        groups.flatMap((g) => (g.items ? g.items.map((i) => i.url) : [g.url]))
      )

      const remaining = items.filter((item) => !groupedUrls.has(item.url))

      const remainingAsDirect = remaining.map((item) => ({
        title: item.title,
        url: item.url,
        icon: item.icon,
      }))

      return [...groups, ...remainingAsDirect]
    },
    []
  )

  const navMain = React.useMemo(() => {
    // If permissions are still loading, show minimal safe navigation
    if (permissionsLoading || !permissionsLoaded) {
      const minimal = data.navMain.filter((item) => {
        // Show Dashboard and items without permissions requirement
        if (item.title === "Dashboard") return true
        if (!item.permissions || item.permissions.length === 0) return true
        // Hide Users if permissions not loaded
        if (item.url === "/users") return false
        return false
      })
      return buildNavMainItems(minimal)
    }

    // If there was an error fetching permissions, show minimal navigation
    if (permissionsError) {
      console.warn('[Sidebar] Error fetching permissions, showing minimal navigation')
      const minimal = data.navMain.filter((item) => {
        if (item.title === "Dashboard") return true
        if (!item.permissions || item.permissions.length === 0) return true
        return false
      })
      return buildNavMainItems(minimal)
    }

    // Filter items based on their permissions array
    // Empty permissions array means always visible
    const allowed = data.navMain.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true
      const hasAccess = hasPermission(item.permissions)
      if (!hasAccess) {
        console.log(`[Sidebar] Hiding "${item.title}" - missing permissions:`, item.permissions)
      }
      return hasAccess
    })
    
    console.log('[Sidebar] Allowed nav items:', allowed.map(i => i.title))
    return buildNavMainItems(allowed)
  }, [permissionsLoaded, permissionsLoading, permissionsError, hasPermission, buildNavMainItems])

  const navSecondary = React.useMemo(() => {
    // If permissions are still loading, show minimal safe navigation
    if (permissionsLoading || !permissionsLoaded) {
      return data.navSecondary.filter((item) => {
        // Show items without permissions requirement
        if (!item.permissions || item.permissions.length === 0) return true
        return false
      })
    }

    // If there was an error fetching permissions, show minimal navigation
    if (permissionsError) {
      return data.navSecondary.filter((item) => {
        if (!item.permissions || item.permissions.length === 0) return true
        return false
      })
    }

    // Filter items based on their permissions array
    // Empty permissions array means always visible
    return data.navSecondary.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true
      return hasPermission(item.permissions)
    })
  }, [permissionsLoaded, permissionsLoading, permissionsError, hasPermission])

  const documents = React.useMemo(() => {
    // If permissions are still loading or there was an error, hide reports
    if (permissionsLoading || !permissionsLoaded || permissionsError) {
      return []
    }

    // Filter documents based on their permissions array
    return data.documents.filter((doc) => {
      if (!doc.permissions || doc.permissions.length === 0) return true
      return hasPermission(doc.permissions)
    })
  }, [permissionsLoaded, permissionsLoading, permissionsError, hasPermission])
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                {logoSrc ? (
                  <Image
                    width={20}
                    height={20}
                    src={logoSrc}
                    alt={settings.pharmacyName}
                    className="mr-2 h-5 w-5 rounded-sm object-cover"
                  />
                ) : (
                  <IconInnerShadowTop className="!size-5 mr-2" />
                )}
                <span className="text-base font-semibold">
                  {settings.pharmacyName || "My Pharmacy"}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

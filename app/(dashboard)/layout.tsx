"use client";

import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import ProtectedRoute from "@/components/ProtectedRoute"
import { usePharmacySettings } from "@/features/settings/hooks/useSettings"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Trigger settings fetch once for dashboard subtree and set document title
  const { settings } = usePharmacySettings()

  React.useEffect(() => {
    if (settings?.pharmacyName && typeof window !== "undefined") {
      document.title = settings.pharmacyName
    }
  }, [settings?.pharmacyName])

  return (
    <ProtectedRoute>
      <SidebarProvider
        style={{
          // Keep these CSS variables consistent with the dashboard design
          // so spacing matches across all dashboard pages
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}



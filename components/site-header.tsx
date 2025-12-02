"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { NotificationBell } from "@/components/notification-bell"
import { usePharmacySettings } from "@/features/settings/hooks/useSettings"
import Image from "next/image"

export function SiteHeader() {
  const { settings } = usePharmacySettings()
  const logoSrc = React.useMemo(() => {
    const url = settings.pharmacyLogoUrl
    if (!url) return null
    if (url.startsWith("http://") || url.startsWith("https://")) return url

    let path = url
    if (!path.startsWith("/")) {
      path = `/${path}`
    }

    if (path.startsWith("/uploads/")) {
      const base = process.env.NEXT_PUBLIC_API_URL
      if (base) {
        try {
          const parsed = new URL(base)
          return `${parsed.origin}${path}`
        } catch {
          // fall through to return path
        }
      }
    }

    return path
  }, [settings.pharmacyLogoUrl])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {logoSrc && (
          <Image
            width={32}
            height={32}
            src={logoSrc}
            alt={settings.pharmacyName}
            className="mr-2 h-6 w-6 rounded-sm object-cover"
          />
        )}
        <h1 className="text-base font-medium">
          {settings.pharmacyName || "My Pharmacy"}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}

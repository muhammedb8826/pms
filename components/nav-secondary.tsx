"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { type Icon } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDownIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
    items?: { title: string; url: string }[]
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const ensureOpenDerivedFromPath = useMemo(() => {
    const next: Record<string, boolean> = {}
    for (const item of items) {
      if (item.items && item.items.length > 0) {
        next[item.title] = item.items.some((s) => pathname === s.url)
      }
    }
    return next
  }, [items, pathname])

  const mergedOpen = { ...ensureOpenDerivedFromPath, ...open }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = Boolean(item.items && item.items.length > 0)
            const childActive = hasChildren && item.items!.some((s) => pathname === s.url)
            const topActive = pathname === item.url || Boolean(childActive)
            const isOpen = hasChildren ? mergedOpen[item.title] : false

            return (
              <SidebarMenuItem key={item.title}>
                {hasChildren ? (
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={topActive}
                    onClick={() =>
                      setOpen(() => {
                        const next: Record<string, boolean> = {}
                        next[item.title] = !isOpen
                        return next
                      })
                    }
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    <span className={`ml-auto opacity-60 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}>
                      <ChevronDownIcon className="size-4" />
                    </span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton tooltip={item.title} asChild isActive={topActive} onClick={() => setOpen({})}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
                {hasChildren && isOpen ? (
                  <SidebarMenuSub>
                    {item.items!.map((sub) => {
                      const active = pathname === sub.url
                      return (
                        <li key={sub.title} data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" className="group/menu-sub-item relative">
                          <SidebarMenuSubButton asChild isActive={active}>
                            <Link href={sub.url}>
                              <span>{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </li>
                      )
                    })}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

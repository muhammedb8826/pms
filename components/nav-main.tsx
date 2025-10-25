"use client"

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

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    items?: { title: string; url: string }[]
  }[]
}) {
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
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {/* <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem> */}
        </SidebarMenu>
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
                        // exclusive open: close others
                        next[item.title] = !isOpen
                        return next
                      })
                    }
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <span className={`ml-auto opacity-60 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}>
                      <ChevronDownIcon className="size-4" />
                    </span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton tooltip={item.title} asChild isActive={topActive} onClick={() => setOpen({})}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
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

"use client"

import { type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import * as React from "react"
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react"
import { usePathname } from "next/navigation"

export function NavMain({
  sections,
}: {
  sections: {
    label: string
    items: (
      | { title: string; url: string; icon?: Icon }
      | { title: string; icon?: Icon; items: { title: string; url: string; icon?: Icon }[] }
    )[]
  }[]
}) {
  const pathname = usePathname()
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({})

  // Initialize openMap with active dropdowns
  React.useEffect(() => {
    const initialOpenMap: Record<string, boolean> = {}
    
    sections.forEach(section => {
      section.items.forEach(item => {
        if ('items' in item && !('url' in item)) {
          const group = item as { title: string; icon?: Icon; items: { title: string; url: string; icon?: Icon }[] }
          // Check if any sub-item matches current path
          const hasActiveChild = group.items.some(subItem => pathname === subItem.url)
          if (hasActiveChild) {
            initialOpenMap[group.title] = true
          }
        }
      })
    })
    
    setOpenMap(initialOpenMap)
  }, [pathname, sections])

  const toggleOpen = (key: string) =>
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const isGroup = 'items' in item && !('url' in item)
                if (!isGroup) {
                  const leaf = item as { title: string; url: string; icon?: Icon }
                  return (
                    <SidebarMenuItem key={leaf.title}>
                      <SidebarMenuButton tooltip={leaf.title} asChild>
                        <a href={leaf.url}>
                          {leaf.icon && <leaf.icon />}
                          <span>{leaf.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                const group = item as { title: string; icon?: Icon; items: { title: string; url: string; icon?: Icon }[] }
                const open = !!openMap[group.title]
                return (
                  <SidebarMenuItem key={group.title}>
                    <SidebarMenuButton onClick={() => toggleOpen(group.title)}>
                      {group.icon && <group.icon />}
                      <span>{group.title}</span>
                      {open ? <IconChevronDown className="ml-auto" /> : <IconChevronRight className="ml-auto" />}
                    </SidebarMenuButton>
                    {open && (
                      <SidebarMenuSub>
                        {group.items.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton href={sub.url}>
                              {sub.icon && <sub.icon />}
                              <span>{sub.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

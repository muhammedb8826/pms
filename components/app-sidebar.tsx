"use client"

import * as React from "react"
import {
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
    },
    {
      title: "Inventory",
      url: "#",
      icon: IconFolder,
      items: [
        { title: "Products", url: "/products" },
        { title: "Batches", url: "/batches" },
        { title: "Categories", url: "/categories" },
        { title: "Manufacturers", url: "/manufacturers" },
      ],
    },
    {
      title: "Operations",
      url: "#",
      icon: IconChartBar,
      items: [
        { title: "Sales", url: "/sales" },
        { title: "Purchases", url: "/purchases" },
        { title: "Requisition", url: "/requisition" },
      ],
    },
    {
      title: "Customers & Partners",
      url: "#",
      icon: IconUsers,
      items: [
        { title: "Customers", url: "/customers" },
        { title: "Suppliers", url: "/suppliers" },
        { title: "Users", url: "/users" },
      ],
    },
    {
      title: "Finance",
      url: "#",
      icon: IconCurrencyDollar,
      items: [
        { title: "Payment History", url: "/payments" },
        { title: "Payment Methods", url: "/payment-methods" },
        { title: "Credits", url: "/credits" },
        { title: "Commissions", url: "/commissions" },
      ],
    },
  ],
  // navClouds: [
  //   {
  //     title: "Capture",
  //     icon: IconCamera,
  //     isActive: true,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Proposal",
  //     icon: IconFileDescription,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Prompts",
  //     icon: IconFileAi,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  // ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
      items: [
        { title: "Unit Categories", url: "/settings/unit-categories" },
        { title: "Units of Measure", url: "/settings/uom" },
      ],
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Reports",
      url: "/reports",
      icon: IconReport,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const sidebarUser = user
    ? {
        name: user.email,
        email: user.email,
        avatar: "",
      }
    : data.user
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
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">PMS</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

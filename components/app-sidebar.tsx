"use client";

import * as React from "react";
import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";

const data = {
  user: {
    name: "muhdev",
    email: "muhdev@gmail.com",
    avatar: "/avatars/muhdev.jpg",
  },
  navSections: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
        { title: "Reports", url: "/reports", icon: IconReport },
      ],
    },
    {
      label: "Catalogue",
      items: [
        {
          title: "Medicines",
          icon: IconListDetails,
          items: [
            { title: "List", url: "/medicines", icon: IconListDetails },
            { title: "Categories", url: "/categories", icon: IconFolder },
          ],
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          title: "Purchase",
          icon: IconListDetails,
          items: [
            { title: "List", url: "/purchase-orders", icon: IconListDetails },
            {
              title: "New",
              url: "/purchase-orders/create",
              icon: IconFileDescription,
            },
          ],
        },
        {
          title: "Sales",
          icon: IconReport,
          items: [
            { title: "List", url: "/sales/list", icon: IconListDetails },
            { title: "New", url: "/sales", icon: IconReport },
          ],
        },
        { title: "Customers", url: "/customers", icon: IconUsers },
        { title: "Suppliers", url: "/suppliers", icon: IconUsers },
        { title: "Users", url: "/users", icon: IconUsers },
      ],
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  
  const userData = {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: "/avatars/user.jpg",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Muhdev Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={data.navSections} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}

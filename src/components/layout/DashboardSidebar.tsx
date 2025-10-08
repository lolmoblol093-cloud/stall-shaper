import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  Building2, 
  Users, 
  Home, 
  LayoutDashboard, 
  MapPin,
  CreditCard,
  Settings,
  FileText
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tenants",
    url: "/dashboard/tenants",
    icon: Users,
  },
  {
    title: "Stalls", 
    url: "/dashboard/stalls",
    icon: Home,
  },
  {
    title: "Directory",
    url: "/dashboard/directory",
    icon: MapPin,
  },
  {
    title: "Payments",
    url: "/dashboard/payments", 
    icon: CreditCard,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export const DashboardSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;
  const getNavCls = (active: boolean) => 
    active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-sidebar-primary" />
            {!isCollapsed && (
              <span className="font-bold text-lg">Property Manager</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 uppercase text-xs font-medium tracking-wide px-2">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={({ isActive }) => getNavCls(isActive)}
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
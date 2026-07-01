
'use client';

import * as React from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  Bike, 
  Box, 
  ClipboardList, 
  Users, 
  Wrench, 
  UserSquare2, 
  BadgeDollarSign, 
  BarChart3, 
  Image as ImageIcon, 
  Tags, 
  Bell, 
  Settings,
  ChevronRight,
  LogOut,
  Monitor
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_MENU = [
  {
    label: "الرئيسية",
    items: [
      { title: "لوحة التحكم", icon: LayoutDashboard, href: "/admin" },
      { title: "نقطة البيع (POS)", icon: Monitor, href: "/admin/pos" },
      { title: "التقارير", icon: BarChart3, href: "/admin/reports" },
    ]
  },
  {
    label: "المتجر",
    items: [
      { title: "المنتجات", icon: ShoppingBag, href: "/admin/products" },
      { title: "الأقسام", icon: Layers, href: "/admin/categories" },
      { title: "أنواع الدراجات", icon: Bike, href: "/admin/motorcycle-types" },
      { title: "المخزون", icon: Box, href: "/admin/inventory" },
    ]
  },
  {
    label: "الورشة",
    items: [
      { title: "نظرة عامة", icon: LayoutDashboard, href: "/admin/workshop" },
      { title: "أوامر التصليح", icon: Wrench, href: "/admin/workshop/orders" },
      { title: "إضافة مهمة", icon: ClipboardList, href: "/admin/workshop/new" },
    ]
  },
  {
    label: "المبيعات",
    items: [
      { title: "الطلبات", icon: ClipboardList, href: "/admin/orders" },
      { title: "العملاء", icon: Users, href: "/admin/customers" },
    ]
  },
  {
    label: "فريق العمل",
    items: [
      { title: "الموظفين", icon: UserSquare2, href: "/admin/employees" },
    ]
  },
  {
    label: "التسويق",
    items: [
      { title: "البنرات الترويجية", icon: ImageIcon, href: "/admin/banners" },
      { title: "العروض الخاصة", icon: Tags, href: "/admin/offers" },
    ]
  },
  {
    label: "النظام",
    items: [
      { title: "الإشعارات", icon: Bell, href: "/admin/notifications" },
      { title: "الإعدادات", icon: Settings, href: "/admin/settings" },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-l bg-card dark:bg-card">
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <span className="text-xl font-black">M</span>
          </div>
          <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-black leading-none">مجمع محمد علاء</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">الإدارة العليا</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {ADMIN_MENU.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={cn(
                          "h-11 px-4 transition-all hover:bg-muted",
                          isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"
                        )}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground")} />
                          <span className="font-bold text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                          {isActive && <div className="mr-auto h-1.5 w-1.5 rounded-full bg-white group-data-[collapsible=icon]:hidden" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-11 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-5 w-5" />
              <span className="font-bold group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

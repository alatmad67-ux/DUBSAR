"use client";

import * as React from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  Box, 
  ClipboardList, 
  Users, 
  Wrench, 
  BarChart3, 
  Settings,
  LogOut,
  Monitor,
  ShieldCheck,
  History,
  Receipt,
  Wallet,
  Truck,
  ArrowLeftRight,
  Banknote,
  Coins,
  Database,
  FileText,
  Lock,
  ScrollText,
  Palette,
  Warehouse,
  ChevronDown,
  CheckSquare,
  Barcode,
  Sparkles,
  Key
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

const ADMIN_MENU = [
  {
    label: "الرئيسية",
    icon: LayoutDashboard,
    items: [
      { title: "لوحة التحكم الحية", icon: LayoutDashboard, href: "/admin" },
      { title: "المهام والتكليفات", icon: CheckSquare, href: "/admin/tasks" },
    ]
  },
  {
    label: "المخزن",
    icon: Warehouse,
    items: [
      { title: "المواد (إضافة / تعديل)", icon: Box, href: "/admin/products" },
      { title: "طباعة باركود المواد", icon: Barcode, href: "/admin/products/barcode" },
      { title: "الجرد والمخزون", icon: ClipboardList, href: "/admin/inventory" },
      { title: "الأقسام والتصنيفات", icon: Layers, href: "/admin/categories" },
      { title: "المستودعات والفروع", icon: Warehouse, href: "/admin/warehouses" },
      { title: "حركات المخزون", icon: History, href: "/admin/inventory/movements" },
      { title: "مناقلات المخزون", icon: ArrowLeftRight, href: "/admin/inventory/transfers" },
    ]
  },
  {
    label: "المبيعات",
    icon: Receipt,
    items: [
      { title: "قائمة بيع", icon: Receipt, href: "/admin/sales" },
      { title: "قائمة بيع كاشير", icon: Monitor, href: "/admin/pos" },
      { title: "قائمة إرجاع بيع", icon: ArrowLeftRight, href: "/admin/returns" },
      { title: "عروض الأسعار والطلبات", icon: ClipboardList, href: "/admin/orders" },
    ]
  },
  {
    label: "المشتريات",
    icon: ShoppingBag,
    items: [
      { title: "قائمة شراء", icon: Truck, href: "/admin/purchases" },
      { title: "فاتورة شراء جديدة", icon: ShoppingBag, href: "/admin/purchases/new" },
      { title: "قائمة الموردين", icon: Users, href: "/admin/suppliers" },
    ]
  },
  {
    label: "السندات",
    icon: Banknote,
    items: [
      { title: "سند قبض", icon: Receipt, href: "/admin/finance/receipts" },
      { title: "سند دفع", icon: Banknote, href: "/admin/finance/payments" },
      { title: "المصاريف العامة", icon: Coins, href: "/admin/finance/expenses" },
      { title: "الصندوق واليومية", icon: History, href: "/admin/finance/cash-register" },
    ]
  },
  {
    label: "الحسابات",
    icon: Wallet,
    items: [
      { title: "كشف حساب والعملاء", icon: Users, href: "/admin/customers" },
      { title: "ديون الزبائن والذمم", icon: Wallet, href: "/admin/finance/debts" },
    ]
  },
  {
    label: "التقارير",
    icon: BarChart3,
    items: [
      { title: "تقرير الحركة اليومية", icon: FileText, href: "/admin/reports/daily" },
      { title: "تقارير الحسابات والديون", icon: FileText, href: "/admin/finance/debts" },
      { title: "تقارير الفواتير والمبيعات", icon: FileText, href: "/admin/sales" },
      { title: "تقارير الأرباح والمصروفات", icon: BarChart3, href: "/admin/reports" },
      { title: "تقارير المخازن والمواد", icon: Box, href: "/admin/inventory/movements" },
      { title: "سجل العمليات والتدقيق", icon: History, href: "/admin/audit-log" },
    ]
  },
  {
    label: "المستخدمون",
    icon: ShieldCheck,
    items: [
      { title: "إدارة الصلاحيات والمستخدمين", icon: ShieldCheck, href: "/admin/employees" },
    ]
  },
  {
    label: "الإعدادات",
    icon: Settings,
    items: [
      { title: "بيانات النشاط والنظام", icon: Settings, href: "/admin/settings" },
      { title: "ترخيص البرنامج (Lifetime)", icon: Key, href: "/admin/license" },
      { title: "تصميم الفواتير والطباعة", icon: Palette, href: "/admin/settings/design" },
      { title: "إعدادات WhatsApp", icon: Palette, href: "/admin/settings/whatsapp" },
      { title: "الأمان والحماية", icon: Lock, href: "/admin/settings/security" },
      { title: "النسخ الاحتياطي", icon: Database, href: "/admin/settings/backup" },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Find initial active section based on current URL
  const initialActiveSection = React.useMemo(() => {
    const found = ADMIN_MENU.find(group => 
      group.items.some(item => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))
    );
    return found ? found.label : "الرئيسية";
  }, [pathname]);

  // SINGLE-OPEN ACCORDION: Exactly one section is active at a time
  const [activeSection, setActiveSection] = React.useState<string>(initialActiveSection);

  // Synchronize active section with URL navigation
  React.useEffect(() => {
    const found = ADMIN_MENU.find(group => 
      group.items.some(item => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))
    );
    if (found) {
      setActiveSection(found.label);
    }
  }, [pathname]);

  const toggleSection = (label: string) => {
    // If clicking current open section, close it; otherwise open this one and close all others
    setActiveSection(prev => prev === label ? "" : label);
  };

  const handleLogout = () => {
    localStorage.removeItem('dubsar_session');
    toast({ title: "تم تسجيل الخروج بنجاح" });
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-l bg-primary text-white select-none" side="right">
      {/* Brand Header */}
      <SidebarHeader className="h-16 flex flex-col items-center justify-center border-b border-white/10 px-3 bg-black/20 shrink-0">
        <Link href="/admin" className="flex items-center gap-2.5 w-full justify-start px-1">
          <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center text-primary shadow-md shrink-0">
            <ScrollText className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden text-right">
            <span className="text-base font-black tracking-tight text-white leading-tight">DUBSAR 2.0</span>
            <span className="text-[9px] font-bold text-amber-300 tracking-wider">Lifetime Edition</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Accordion Menu: Single Section Open at a Time & Compact */}
      <SidebarContent className="py-2 px-2 custom-scrollbar overflow-y-auto space-y-0.5">
        {ADMIN_MENU.map((group) => {
          const isOpen = activeSection === group.label;
          const hasActiveChild = group.items.some(item => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)));

          return (
            <div key={group.label} className="rounded-xl overflow-hidden transition-all duration-150">
              {/* Category Header Button */}
              <button
                type="button"
                onClick={() => toggleSection(group.label)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all duration-150 text-right cursor-pointer group-data-[collapsible=icon]:justify-center",
                  hasActiveChild 
                    ? "bg-white/15 text-white font-black shadow-sm" 
                    : "text-white/80 hover:bg-white/10 hover:text-white font-bold"
                )}
                title={group.label}
              >
                <div className="flex items-center gap-2">
                  <group.icon className={cn("h-4 w-4 shrink-0 transition-transform", hasActiveChild ? "text-amber-300 scale-110" : "text-white/70")} />
                  <span className="text-xs font-black tracking-tight group-data-[collapsible=icon]:hidden">
                    {group.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:hidden">
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-white/10 text-white/60 font-bold">
                    {group.items.length}
                  </span>
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-white/60 transition-transform duration-200",
                    isOpen ? "rotate-180 text-amber-300" : "rotate-0"
                  )} />
                </div>
              </button>

              {/* Submenu Items (Only open for the single active section) */}
              {isOpen && (
                <div className="mr-3 pr-1.5 my-1 border-r-2 border-white/20 space-y-0.5 group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 text-right block",
                          isActive 
                            ? "bg-white/25 text-white font-black shadow-sm border-r-2 border-amber-300" 
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-amber-300 scale-105" : "text-white/60")} />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2 border-t border-white/10 bg-black/20 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-white/80 hover:bg-rose-500/20 hover:text-rose-200 transition-colors text-right group-data-[collapsible=icon]:justify-center font-bold text-xs"
        >
          <div className="flex items-center gap-2">
            <LogOut className="h-3.5 w-3.5 text-rose-300 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
          </div>
          <span className="text-[10px] text-white/40 group-data-[collapsible=icon]:hidden font-mono">v2.0.4</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
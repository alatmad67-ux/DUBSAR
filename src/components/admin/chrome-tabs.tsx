'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  X, LayoutDashboard, Receipt, Monitor, Box, Layers, Users, Truck, 
  Warehouse, Wrench, Banknote, BarChart3, Settings, ShieldCheck, 
  ScrollText, Palette, FileText, ShoppingBag, Bell, CreditCard, ArrowLeftRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
  path: string;
  title: string;
}

const ROUTE_MAP: Record<string, { title: string; icon?: any }> = {
  '/admin': { title: 'الرئيسية', icon: LayoutDashboard },
  '/admin/pos': { title: 'نقطة البيع (POS)', icon: Monitor },
  '/admin/sales': { title: 'المبيعات والفواتير', icon: Receipt },
  '/admin/returns': { title: 'قائمة إرجاع بيع', icon: ArrowLeftRight },
  '/admin/products': { title: 'المنتجات والمخزن', icon: Box },
  '/admin/categories': { title: 'الأقسام والتصنيفات', icon: Layers },
  '/admin/inventory': { title: 'المخزون والجرد', icon: Warehouse },
  '/admin/inventory/movements': { title: 'حركات المخزون', icon: ScrollText },
  '/admin/inventory/transfers': { title: 'مناقلات الفروع', icon: Truck },
  '/admin/purchases': { title: 'سجل المشتريات', icon: ShoppingBag },
  '/admin/purchases/new': { title: 'فاتورة شراء جديدة', icon: ShoppingBag },
  '/admin/suppliers': { title: 'الموردين', icon: Truck },
  '/admin/customers': { title: 'الزبائن والعملاء', icon: Users },
  '/admin/warehouses': { title: 'المستودعات والفروع', icon: Warehouse },
  '/admin/workshop': { title: 'الورشة والصيانة', icon: Wrench },
  '/admin/workshop/new': { title: 'أمر صيانة جديد', icon: Wrench },
  '/admin/workshop/orders': { title: 'سجل الصيانة', icon: Wrench },
  '/admin/finance/expenses': { title: 'سندات الصرف', icon: Banknote },
  '/admin/finance/receipts': { title: 'سندات القبض', icon: Banknote },
  '/admin/finance/payments': { title: 'المدفوعات', icon: Banknote },
  '/admin/finance/debts': { title: 'الديون والذمم', icon: CreditCard },
  '/admin/finance/cash-register': { title: 'الصندوق واليومية', icon: Banknote },
  '/admin/reports': { title: 'التقارير المالية', icon: BarChart3 },
  '/admin/employees': { title: 'المستخدمين والصلاحيات', icon: Users },
  '/admin/settings': { title: 'إعدادات النظام', icon: Settings },
  '/admin/settings/security': { title: 'الأمان والحماية', icon: ShieldCheck },
  '/admin/settings/design': { title: 'تصميم الفواتير', icon: Palette },
  '/admin/settings/backup': { title: 'النسخ الاحتياطي', icon: FileText },
  '/admin/audit-log': { title: 'سجل التدقيق', icon: ScrollText },
  '/admin/orders': { title: 'الطلبات', icon: ShoppingBag },
  '/admin/offers': { title: 'العروض', icon: Palette },
  '/admin/notifications': { title: 'الإشعارات', icon: Bell }
};

function getRouteInfo(pathname: string): { title: string; icon?: any } {
  if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname];
  if (pathname.startsWith('/admin/print')) return { title: 'معاينة الطباعة', icon: FileText };
  if (pathname.startsWith('/admin/workshop/')) return { title: 'تفاصيل الصيانة', icon: Wrench };
  if (pathname.startsWith('/admin/finance/statements/')) return { title: 'كشف حساب', icon: FileText };
  if (pathname.startsWith('/admin/products/')) return { title: 'تفاصيل المادة', icon: Box };
  return { title: 'صفحة إدارية', icon: LayoutDashboard };
}

const STORAGE_KEY = 'dubsar_admin_tabs';

export function ChromeTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const [tabs, setTabs] = useState<TabItem[]>([{ path: '/admin', title: 'الرئيسية' }]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!pathname || !pathname.startsWith('/admin')) return;

    setTabs((prevTabs) => {
      const exists = prevTabs.some((t) => t.path === pathname);
      let updated: TabItem[];
      if (exists) {
        updated = prevTabs;
      } else {
        const info = getRouteInfo(pathname);
        updated = [...prevTabs, { path: pathname, title: info.title }];
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [pathname]);

  const handleSelectTab = (path: string) => {
    if (path !== pathname) {
      router.push(path);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (tabs.length === 1 && tabs[0].path === '/admin') return;

    const newTabs = tabs.filter((t) => t.path !== path);
    const fallbackTabs = newTabs.length > 0 ? newTabs : [{ path: '/admin', title: 'الرئيسية' }];
    setTabs(fallbackTabs);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackTabs));
    } catch {}

    if (pathname === path) {
      const closedIndex = tabs.findIndex((t) => t.path === path);
      const nextTab = newTabs[Math.max(0, closedIndex - 1)] || fallbackTabs[0];
      router.push(nextTab.path);
    }
  };

  if (!pathname || !pathname.startsWith('/admin')) return null;

  return (
    <div 
      className="chrome-tabs-bar w-full bg-[#e2e8f0]/80 dark:bg-[#0f172a] border-b border-border/80 flex items-center px-3 pt-1.5 gap-1.5 overflow-x-auto select-none"
      style={{ scrollbarWidth: 'none' }}
      dir="rtl"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        const info = getRouteInfo(tab.path);
        const IconComponent = info.icon || LayoutDashboard;

        return (
          <div
            key={tab.path}
            onClick={() => handleSelectTab(tab.path)}
            title={tab.title}
            className={cn(
              "group relative h-9 px-3.5 flex items-center gap-2 text-xs rounded-t-xl transition-all cursor-pointer border-t border-x select-none",
              isActive
                ? "bg-white dark:bg-background text-primary border-border/80 border-b-white dark:border-b-background shadow-sm z-10 font-black min-w-[130px] max-w-[200px]"
                : "bg-slate-200/60 dark:bg-slate-800/40 text-muted-foreground border-transparent hover:bg-white/70 dark:hover:bg-slate-800/80 hover:text-foreground font-bold min-w-[110px] max-w-[180px]"
            )}
          >
            <IconComponent className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground opacity-70")} />
            
            <span className="truncate flex-1 text-right">{tab.title}</span>

            {(tabs.length > 1 || tab.path !== '/admin') && (
              <button
                type="button"
                onClick={(e) => handleCloseTab(e, tab.path)}
                className="h-4 w-4 rounded-md flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-muted-foreground hover:text-destructive transition-colors shrink-0 mr-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

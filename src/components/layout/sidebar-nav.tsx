
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Wrench, 
  Users, 
  Warehouse, 
  CreditCard, 
  Settings,
  MessageSquare,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAFF_NAV_ITEMS = [
  { label: "لوحة التحكم", icon: LayoutDashboard, href: "/admin" },
  { label: "المبيعات (POS)", icon: CreditCard, href: "/pos" },
  { label: "إدارة المنتجات", icon: ShoppingBag, href: "/inventory" },
  { label: "الورشة", icon: Wrench, href: "/workshop" },
  { label: "المستودع", icon: Warehouse, href: "/warehouse" },
  { label: "العملاء", icon: Users, href: "/customers" },
  { label: "التقارير", icon: BarChart3, href: "/reports" },
  { label: "الإعدادات", icon: Settings, href: "/settings" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-l bg-card p-4 md:flex">
      <div className="mb-8 flex items-center gap-3 px-4 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <span className="text-xl font-bold text-white">M</span>
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">مجمع محمد علاء</h1>
          <p className="text-xs text-muted-foreground">المنصة الرسمية</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {STAFF_NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all hover:bg-muted",
                isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-white" : "group-hover:text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl bg-accent p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-500/20" />
          <div>
            <p className="text-sm font-bold">محمد علاء</p>
            <p className="text-xs text-muted-foreground">مدير النظام</p>
          </div>
        </div>
      </div>
    </aside>
  );
}


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "الرئيسية", icon: Home, href: "/" },
  { label: "الأقسام", icon: LayoutGrid, href: "/catalog" },
  { label: "طلباتي", icon: ClipboardList, href: "/orders" },
  { label: "حسابي", icon: User, href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/80 px-4 pb-safe backdrop-blur-lg md:hidden shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative group",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "rounded-full px-5 py-1 transition-all duration-300",
              isActive && "bg-primary/15"
            )}>
              <Icon className={cn("h-6 w-6 transition-transform duration-300", isActive && "scale-110")} />
            </div>
            <span className={cn("text-[10px] font-bold transition-all", isActive ? "opacity-100" : "opacity-70")}>
              {item.label}
            </span>
            {isActive && (
              <span className="absolute -top-1 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

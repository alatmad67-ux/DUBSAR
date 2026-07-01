
"use client";

import { Bell, Search, ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden rounded-full">
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-foreground hidden sm:block">
              MMA
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/search">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-muted">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          </Button>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-muted">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
                3
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

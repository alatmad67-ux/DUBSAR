
'use client';

import { Bell, Search, Settings, Sun, Moon, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AdminHeader() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="relative hidden w-72 md:block">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="بحث سريع (Ctrl + K)" 
            className="h-10 rounded-xl bg-muted/50 pr-10 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl hover:bg-muted">
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-muted">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 rounded-xl p-1 gap-2 hover:bg-muted transition-all">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>MA</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start pr-1 hidden sm:flex">
                 <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Admin</span>
                 <span className="text-xs font-bold leading-none">محمد علاء</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
            <DropdownMenuLabel className="font-bold">حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl font-medium cursor-pointer">الملف الشخصي</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl font-medium cursor-pointer">الإعدادات</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl font-medium cursor-pointer text-destructive">تسجيل الخروج</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

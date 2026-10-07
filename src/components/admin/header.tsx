'use client';

import { Bell, CheckSquare, Sun, Moon, User, LogOut, Minus, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { TaskService } from "@/services/task-service";
import { InternalNotificationService, InternalNotification } from "@/services/internal-notification-service";
import { cn } from "@/lib/utils";

export function AdminHeader() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState<InternalNotification[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsDesktop(typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__);
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    const sessionStr = localStorage.getItem('dubsar_session');
    if (sessionStr) {
      try {
        setUser(JSON.parse(sessionStr));
      } catch (e) {
        console.error(e);
      }
    }

    // Load tasks count
    TaskService.getTasks().then(tasks => {
      if (Array.isArray(tasks)) {
        const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
        setPendingTasksCount(pending);
      }
    }).catch(() => {});

    // Load internal system alerts
    const loadAlerts = () => {
      InternalNotificationService.getSystemNotifications().then(alerts => {
        setActiveAlerts(alerts.filter(a => !a.read));
      }).catch(() => {});
    };

    loadAlerts();
    const alertInterval = setInterval(loadAlerts, 15000);
    return () => clearInterval(alertInterval);
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

  const handleLogout = () => {
    localStorage.removeItem('dubsar_session');
    toast({ title: "تم تسجيل الخروج" });
    router.push("/login");
  };

  const handleMinimize = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isDesktop) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('app_minimize');
      } catch {
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          await getCurrentWindow().minimize();
        } catch (err) {
          console.error('[Window Minimize Error]', err);
        }
      }
    }
  };

  const handleMaximize = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isDesktop) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('app_toggle_maximize');
      } catch {
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          await getCurrentWindow().toggleMaximize();
        } catch (err) {
          console.error('[Window Maximize Error]', err);
        }
      }
    }
  };

  const handleClose = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isDesktop) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('app_close');
      } catch {
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          await getCurrentWindow().destroy();
        } catch (err) {
          console.error('[Window Close Error]', err);
        }
      }
    }
  };

  return (
    <header 
      className="chrome-tabs-bar sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur select-none cursor-default" 
      data-tauri-drag-region
      onDoubleClick={handleMaximize}
    >
      {/* Right Side: Sidebar Toggle & Branding */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8 text-foreground" />
        <div className="flex items-center gap-2">
          <span className="font-black text-sm tracking-wider text-primary">DUBSAR 2.0</span>
          <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded bg-muted/60">نظام المبيعات</span>
        </div>
      </div>

      {/* Middle/Left Side: Controls, Actions & Native Window Controls */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="تبديل المظهر" className="h-8 w-8 rounded-lg hover:bg-muted text-foreground">
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Link href="/admin/tasks">
          <Button variant="ghost" size="icon" title="المهام والتكليفات" className="relative h-8 w-8 rounded-lg hover:bg-muted text-foreground">
            <CheckSquare className="h-4 w-4" />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                {pendingTasksCount}
              </span>
            )}
          </Button>
        </Link>

        {/* Interactive Internal ERP Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="تنبيهات النظام الداخلي" className="relative h-8 w-8 rounded-lg hover:bg-muted text-foreground">
              <Bell className="h-4 w-4" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white animate-pulse">
                  {activeAlerts.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl p-0 border shadow-2xl overflow-hidden" dir="rtl">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-xs text-primary">
                <Bell className="h-3.5 w-3.5" />
                <span>تنبيهات النظام والمخزون</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">
                {activeAlerts.length} تنبيهات نشطة
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {activeAlerts.length > 0 ? (
                activeAlerts.slice(0, 5).map((alert) => (
                  <div 
                    key={alert.id} 
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer space-y-1"
                    onClick={() => {
                      InternalNotificationService.markAsRead(alert.id);
                      router.push(alert.link);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className={cn(
                          "h-2 w-2 rounded-full",
                          alert.severity === 'critical' ? "bg-red-500" : "bg-amber-500"
                        )} />
                        {alert.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                      {alert.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground text-xs font-bold">
                  لا توجد تنبيهات عاجلة حالياً، المخزون والعمليات بحالة ممتازة.
                </div>
              )}
            </div>

            <div className="p-2 border-t bg-slate-50 dark:bg-slate-800/80 text-center">
              <Link href="/admin/notifications">
                <Button variant="ghost" size="sm" className="w-full text-xs font-black text-primary h-8 rounded-xl hover:bg-primary/10">
                  فتح مركز التنبيهات الكامل
                </Button>
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 rounded-lg px-2 gap-2 hover:bg-muted">
              <Avatar className="h-6 w-6 rounded-md">
                <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-[10px]">
                  {user?.displayName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-bold text-foreground hidden sm:inline">{user?.displayName || 'المستخدم'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl p-2 border shadow-xl">
            <DropdownMenuLabel className="font-bold text-xs">{user?.displayName || 'المستخدم'}</DropdownMenuLabel>
            <div className="px-2 pb-1 text-[10px] text-muted-foreground">{user?.role === 'owner' ? 'المالك' : user?.role === 'manager' ? 'مدير' : 'موظف مبيعات'}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg text-xs font-medium cursor-pointer" onClick={() => router.push('/profile')}>الملف الشخصي</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-xs font-medium cursor-pointer" onClick={() => router.push('/admin/settings')}>الإعدادات العامة</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="rounded-lg text-xs font-bold cursor-pointer text-destructive gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Window Controls for Desktop (Windows style) */}
        {isDesktop && (
          <div className="flex items-center border-r pr-2 mr-1 gap-1 border-muted" data-tauri-drag-region="false">
            <Button variant="ghost" size="icon" onClick={handleMinimize} title="تصغير" className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-transform">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleMaximize} title="تكبير / استعادة" className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-transform">
              <Square className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose} title="إغلاق البرنامج" className="h-7 w-7 rounded hover:bg-destructive hover:text-destructive-foreground text-muted-foreground active:scale-95 transition-transform">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

'use client';

import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  PackageX, 
  CreditCard, 
  CheckSquare, 
  ArrowLeft, 
  RefreshCw, 
  Loader2, 
  Check, 
  ShieldAlert, 
  Warehouse, 
  Users, 
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { InternalNotificationService, InternalNotification } from "@/services/internal-notification-service";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'stock' | 'debt' | 'task'>('all');
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await InternalNotificationService.getSystemNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ", description: "تعذر تحميل تنبيهات النظام." });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = () => {
    const ids = notifications.map(n => n.id);
    InternalNotificationService.markAllAsRead(ids);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({ title: "تم تحديث التنبيهات", description: "تم تحديد جميع التنبيهات كمقروءة." });
  };

  const handleNotificationClick = (n: InternalNotification) => {
    InternalNotificationService.markAsRead(n.id);
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    router.push(n.link);
  };

  const filtered = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(n => n.type === activeTab);
  }, [notifications, activeTab]);

  const stats = useMemo(() => {
    const stockCount = notifications.filter(n => n.type === 'stock').length;
    const debtCount = notifications.filter(n => n.type === 'debt').length;
    const taskCount = notifications.filter(n => n.type === 'task').length;
    const unreadCount = notifications.filter(n => !n.read).length;
    return { stockCount, debtCount, taskCount, unreadCount, total: notifications.length };
  }, [notifications]);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-20" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">مركز تنبيهات وإشعارات النظام</h1>
            {stats.unreadCount > 0 && (
              <Badge className="bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30 font-black text-xs px-2.5 py-0.5 rounded-full">
                {stats.unreadCount} غير مقروءة
              </Badge>
            )}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            تنبيهات فورية لنواقص المخزون، ديون العملاء المستحقة، والمهام الإدارية المطلوبة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadNotifications} 
            disabled={loading} 
            className="rounded-xl h-10 px-3 font-bold text-xs gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span>تحديث التنبيهات</span>
          </Button>

          {stats.unreadCount > 0 && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleMarkAllAsRead} 
              className="rounded-xl h-10 px-4 font-black text-xs gap-1.5"
            >
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>تحديد الكل كمقروء</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">كافة التنبيهات</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</p>
              <p className="text-[11px] text-blue-600 font-bold">{stats.unreadCount} تنبيهات بحاجة لإجراء</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">نواقص المخزون</span>
              <p className="text-2xl font-black text-red-600 font-mono">{stats.stockCount}</p>
              <p className="text-[11px] text-red-600 font-bold">مواد نفدت أو قاربت على النفاد</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600">
              <PackageX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">ديون وذمم العملاء</span>
              <p className="text-2xl font-black text-purple-600 font-mono">{stats.debtCount}</p>
              <p className="text-[11px] text-purple-600 font-bold">عملاء لديهم مبالغ مستحقة</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">المهام المستعجلة</span>
              <p className="text-2xl font-black text-amber-600 font-mono">{stats.taskCount}</p>
              <p className="text-[11px] text-amber-600 font-bold">تكليفات بانتظار الإنجاز</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <TabsList className="h-12 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl gap-1">
          <TabsTrigger value="all" className="rounded-lg font-bold text-xs px-4">
            الكل ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="stock" className="rounded-lg font-bold text-xs px-4">
            نواقص المخزون ({stats.stockCount})
          </TabsTrigger>
          <TabsTrigger value="debt" className="rounded-lg font-bold text-xs px-4">
            ديون العملاء ({stats.debtCount})
          </TabsTrigger>
          <TabsTrigger value="task" className="rounded-lg font-bold text-xs px-4">
            المهام ({stats.taskCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto opacity-40" />
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((alert) => (
              <Card 
                key={alert.id} 
                className={cn(
                  "rounded-2xl border transition-all hover:shadow-md cursor-pointer",
                  alert.read 
                    ? "bg-white/60 dark:bg-slate-900/60 opacity-80" 
                    : alert.severity === 'critical' 
                      ? "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40" 
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                )}
                onClick={() => handleNotificationClick(alert)}
              >
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      alert.type === 'stock' && alert.severity === 'critical' 
                        ? "bg-red-600 text-white" 
                        : alert.type === 'stock' 
                          ? "bg-amber-500 text-white" 
                          : alert.type === 'debt' 
                            ? "bg-purple-600 text-white" 
                            : "bg-blue-600 text-white"
                    )}>
                      {alert.type === 'stock' ? <PackageX className="h-6 w-6" /> : alert.type === 'debt' ? <CreditCard className="h-6 w-6" /> : <CheckSquare className="h-6 w-6" />}
                    </div>

                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{alert.title}</span>
                        {!alert.read && (
                          <span className="h-2 w-2 rounded-full bg-red-600" title="غير مقروء" />
                        )}
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {alert.type === 'stock' ? 'مخزون ومواد' : alert.type === 'debt' ? 'حسابات وذمم' : 'مهمة إدارية'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        {alert.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        {new Date(alert.timestamp).toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="rounded-xl font-bold text-xs h-9 px-4 gap-1.5 shrink-0 shadow-sm"
                  >
                    <span>{alert.actionText}</span>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="rounded-2xl border border-dashed p-12 text-center bg-white/50 dark:bg-slate-900/50">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-black text-slate-800 dark:text-slate-200 text-base mb-1">لا توجد تنبيهات حالية</h3>
              <p className="text-xs text-muted-foreground font-medium">كافة حركات المخزون والديون والمهام ضمن الحدود الطبيعية المستقرة.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
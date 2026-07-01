
'use client';

import { useMemo } from "react";
import { History, User, Clock, ShieldInfo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AuditLogPage() {
  const db = useFirestore();
  const logsQuery = useMemo(() => query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50)), [db]);
  const { data: logs, loading } = useCollection(logsQuery);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black">سجل العمليات (Audit Log)</h1>
        <p className="text-muted-foreground font-medium">تتبع كافة التغييرات والعمليات التي تمت في النظام.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : logs.length > 0 ? (
          logs.map((log: any) => (
            <div key={log.id} className="flex items-center gap-4 p-5 bg-white border rounded-[28px] shadow-sm hover:shadow-md transition-shadow">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                log.action.includes('حذف') ? "bg-red-50 text-red-600" :
                log.action.includes('إضافة') ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
              )}>
                <ShieldInfo className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">{log.action}</span>
                  <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.timestamp).toLocaleString("ar-EG")}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <User className="h-3.5 w-3.5" /> {log.userName || 'غير معروف'}
                  </span>
                  <span className="text-primary font-bold">{log.target}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{log.details}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-[32px] gap-4">
            <History className="h-16 w-16 opacity-10" />
            <p className="font-bold">لا توجد سجلات حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

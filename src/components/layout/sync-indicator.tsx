
'use client';

import { useSyncStatus } from '@/hooks/use-sync-status';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SyncIndicator() {
  const { status, lastSync } = useSyncStatus();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 border shadow-sm cursor-help",
            status === 'online' ? "bg-green-50 text-green-700 border-green-100" :
            status === 'offline' ? "bg-red-50 text-red-700 border-red-100 animate-pulse" :
            "bg-blue-50 text-blue-700 border-blue-100"
          )}>
            {status === 'online' && <Cloud className="h-3.5 w-3.5" />}
            {status === 'offline' && <CloudOff className="h-3.5 w-3.5" />}
            {status === 'syncing' && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            
            <span className="hidden sm:inline">
              {status === 'online' ? 'متصل ومحمي' : status === 'offline' ? 'النظام نشط ومستقر' : 'جاري المزامنة...'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="rounded-xl border-none shadow-2xl p-4 space-y-1">
          <p className="font-black text-xs">حالة النظام</p>
          <p className="text-[10px] text-muted-foreground font-bold">
            {status === 'offline' 
              ? 'أنت تعمل على النسخة المحلية المستقرة. كافة بياناتك وفواتيرك محفوظة ومؤمنة في جهازك.' 
              : 'البيانات مؤمنة ومحدثة بشكل فوري.'}
          </p>
          {lastSync && (
            <div className="flex items-center gap-1.5 pt-2 text-[10px] text-green-600 font-black">
              <CheckCircle2 className="h-3 w-3" />
              آخر مزامنة ناجحة: {lastSync.toLocaleTimeString("ar-EG")}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

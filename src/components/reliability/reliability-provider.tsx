
'use client';

import React, { createContext, useContext } from 'react';
import { useReliability, HealthStatus } from '@/hooks/use-reliability';
import { WifiOff, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ReliabilityContextType {
  isOnline: boolean;
  isSyncing?: boolean;
  lastSync?: Date | null;
  healthStatus: HealthStatus;
}

const ReliabilityContext = createContext<ReliabilityContextType | undefined>(undefined);

export function ReliabilityProvider({ children }: { children: React.ReactNode }) {
  const reliability = useReliability();

  return (
    <ReliabilityContext.Provider value={reliability}>
      {children}
      
      {/* Global Reliability Overlay */}
      <div className="fixed bottom-20 left-6 z-[100] md:bottom-6">
        {false ? (
          <div className="bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-left duration-500 border border-red-500/50">
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
              <WifiOff className="h-5 w-5" />
            </div>
            <div className="text-right">
              <p className="font-black text-xs">النظام يعمل محلياً</p>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">البيانات محفوظة في جهازك</p>
            </div>
          </div>
        ) : (reliability as any).isSyncing ? (
          <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-pulse border border-blue-500/50">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-xs font-black">جاري مزامنة البيانات...</span>
          </div>
        ) : null}
      </div>
    </ReliabilityContext.Provider>
  );
}

export function useReliabilityStatus() {
  const context = useContext(ReliabilityContext);
  if (!context) throw new Error('useReliabilityStatus must be used within ReliabilityProvider');
  return context;
}

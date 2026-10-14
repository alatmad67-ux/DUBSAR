
'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { ChromeTabs } from "@/components/admin/chrome-tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReliabilityProvider } from "@/components/reliability/reliability-provider";
import { Loader2, ShieldAlert } from "lucide-react";
import { LicenseGate } from "@/components/license/license-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // التحقق من الجلسة المحلية (DUBSAR 2.0 Local Auth)
    try {
      const sessionStr = localStorage.getItem('dubsar_session');
      if (sessionStr) {
        setUser(JSON.parse(sessionStr));
        setReady(true);
        import('@tauri-apps/api/core').then(({ invoke }) => invoke('set_main_window')).catch(() => {});
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FDF8F5]">
         <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-20" />
            <p className="font-black text-primary">جاري فتح نظام دوبسار...</p>
         </div>
      </div>
    );
  }

  return (
    <LicenseGate>
      <ReliabilityProvider>
        <SidebarProvider>
          <div className="flex h-screen w-full bg-[#FDF8F5] dark:bg-background/95 overflow-hidden" dir="rtl">
            <AdminSidebar />
            <SidebarInset className="flex flex-col flex-1 h-screen min-w-0 overflow-hidden">
              <div className="shrink-0 z-30">
                <AdminHeader />
                <ChromeTabs />
              </div>
              <main className="flex-1 min-h-0 p-3 md:p-5 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="mx-auto w-full max-w-[1920px] relative">
                  {children}
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ReliabilityProvider>
    </LicenseGate>
  );
}

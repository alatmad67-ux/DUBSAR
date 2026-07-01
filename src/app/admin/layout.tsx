
'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// القائمة البيضاء لأرقام الهواتف التي لها صلاحيات المدير (كإجراء أمان إضافي)
const ADMIN_PHONES = ['07858833838', '+9647858833838'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        // التحقق من الصلاحيات بناءً على الدور في Firestore أو رقم الهاتف الصريح
        const isMasterAdmin = (profile?.role === 'admin') || (profile?.phoneNumber && ADMIN_PHONES.includes(profile.phoneNumber));
        const isStaff = profile && ['admin', 'sales_employee', 'workshop_technician', 'warehouse_employee'].includes(profile.role);

        if (isStaff || isMasterAdmin) {
          setIsAuthorized(true);
        } else {
          router.replace('/');
        }
      }
    }
  }, [user, profile, loading, router]);

  if (loading || (!isAuthorized && user)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-8 gap-8">
         <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-xl animate-bounce">
            <span className="text-2xl font-black italic">M</span>
         </div>
         <div className="w-full max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
               <Skeleton className="h-10 w-48 rounded-xl" />
               <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <Skeleton className="h-32 rounded-[28px]" />
               <Skeleton className="h-32 rounded-[28px]" />
               <Skeleton className="h-32 rounded-[28px]" />
               <Skeleton className="h-32 rounded-[28px]" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-[28px]" />
         </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F8F9FA] dark:bg-background/95">
        <AdminSidebar />
        <SidebarInset className="flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

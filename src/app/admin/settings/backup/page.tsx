'use client';

import React, { useState, useEffect } from "react";
import { 
  Database, 
  Download, 
  Upload, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  HardDrive,
  FolderArchive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { AdapterFactory } from "@/infra/database/adapter-factory";
import { DB_COMMANDS } from "@/infra/database/adapter";
import { AuditService } from "@/services/audit-service";

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupPath, setBackupPath] = useState("C:\\DUBSAR_Backups\\dubsar_backup.sqlite3");
  const [restorePath, setRestorePath] = useState("");
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    // Generate default timestamped backup path
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    setBackupPath(`C:\\DUBSAR_Backups\\dubsar_backup_${timestamp}.sqlite3`);

    AuditService.getRecentLogs(50).then(logs => {
      if (Array.isArray(logs)) {
        const backupLogs = logs.filter(l => l.module === 'backup' || l.action?.includes('backup') || l.action?.includes('restore'));
        setRecentLogs(backupLogs);
      }
    }).catch(() => {});
  }, []);

  const handleCreateBackup = async () => {
    if (!backupPath.trim()) {
      toast({ variant: "destructive", title: "يرجى تحديد مسار النسخة الاحتياطية" });
      return;
    }

    setIsExporting(true);
    try {
      const adapter = AdapterFactory.getAdapter();
      const res = await adapter.execute(DB_COMMANDS.BACKUP_DATABASE, { destPath: backupPath.trim() });
      if (res && res.success) {
        toast({ 
          title: "تم حفظ النسخة الاحتياطية بنجاح", 
          description: `تم حفظ الملف في: ${backupPath}` 
        });
        await AuditService.log('backup_create', 'backup', `تم إنشاء نسخة احتياطية في: ${backupPath}`);
      } else {
        throw new Error(res?.error || "فشل التصدير");
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ في النسخ الاحتياطي", description: e.message || "حدث خطأ أثناء نسخ قاعدة البيانات" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restorePath.trim()) {
      toast({ variant: "destructive", title: "يرجى تحديد مسار ملف النسخة الاحتياطية للاستعادة" });
      return;
    }

    setIsImporting(true);
    try {
      const adapter = AdapterFactory.getAdapter();
      const res = await adapter.execute(DB_COMMANDS.RESTORE_DATABASE, { srcPath: restorePath.trim() });
      if (res && res.success) {
        toast({ 
          title: "تم استعادة قاعدة البيانات بنجاح", 
          description: "تم استبدال قاعدة البيانات بالملف المحدد. يرجى إعادة تشغيل التطبيق لضمان استقرار الجلسة." 
        });
        await AuditService.log('backup_restore', 'backup', `تمت استعادة قاعدة البيانات من: ${restorePath}`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(res?.error || "فشل الاستعادة");
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ في الاستعادة", description: e.message || "فشل استعادة قاعدة البيانات" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-16" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span>النسخ الاحتياطي واستعادة قاعدة البيانات</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            إدارة نسخ قاعدة البيانات المحلية SQLite3 لضمان حماية واستقرار بيانات النظام
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Backup */}
        <Card className="rounded-2xl border shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Download className="h-5 w-5 text-emerald-600" />
              <span>إنشاء نسخة احتياطية جديدة (Backup)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              حفظ نسخة محليّة كاملة من ملف قاعدة البيانات (.sqlite3)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">مسار حفظ النسخة على الجهاز</label>
              <Input 
                value={backupPath}
                onChange={e => setBackupPath(e.target.value)}
                placeholder="C:\DUBSAR_Backups\dubsar_backup.sqlite3"
                className="h-10 rounded-xl font-mono text-xs"
              />
            </div>

            <Button 
              onClick={handleCreateBackup}
              disabled={isExporting}
              className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 rounded-xl"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>إنشاء وحفظ النسخة الاحتياطية الآن</span>
            </Button>
          </CardContent>
        </Card>

        {/* Restore Backup */}
        <Card className="rounded-2xl border shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2 text-rose-600">
              <Upload className="h-5 w-5" />
              <span>استعادة نسخة احتياطية (Restore)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              استبدال بيانات النظام الحالية بنسخة محليّة سابقة
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">مسار ملف النسخة الاحتياطية المراد استعادتها</label>
              <Input 
                value={restorePath}
                onChange={e => setRestorePath(e.target.value)}
                placeholder="C:\DUBSAR_Backups\dubsar_backup.sqlite3"
                className="h-10 rounded-xl font-mono text-xs"
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  disabled={isImporting || !restorePath.trim()}
                  variant="destructive"
                  className="w-full font-bold gap-2 h-10 rounded-xl"
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>استعادة النسخة الاحتياطية</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl" dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-lg text-rose-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>تأكيد استعادة قاعدة البيانات</span>
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    تحذير: سيتم كتابة ملف النسخة الاحتياطية المحددة واستبدال جميع بيانات المبيعات والمواد الحالية بها. هل أنت تأكد من الاستمرار؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel className="font-bold rounded-xl">إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestoreBackup} className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                    تأكيد الاستعادة الآن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Backup Audit History */}
      <Card className="rounded-2xl border shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-black">سجل عمليات النسخ والاستعادة الأخيرة</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 font-black border-y">
              <tr>
                <th className="p-3">العملية</th>
                <th className="p-3">التفاصيل / المسار</th>
                <th className="p-3">المستخدم</th>
                <th className="p-3">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 text-primary">{log.action}</td>
                    <td className="p-3 font-mono text-[11px]">{log.details}</td>
                    <td className="p-3">{log.userName || log.user || 'نظام'}</td>
                    <td className="p-3 font-mono text-muted-foreground">{new Date(log.timestamp).toLocaleString('ar-IQ')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground text-xs font-bold">
                    لا توجد سجلات نسخ احتياطي سابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

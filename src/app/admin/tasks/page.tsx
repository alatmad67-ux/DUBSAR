'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TaskService, TaskItem } from '@/services/task-service';
import { LocalAuthService } from '@/services/local-auth-service';
import { toast } from '@/hooks/use-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const rows = await TaskService.getTasks();
      setTasks(rows || []);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'فشل تحميل قائمة المهام' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // Load users for assignment
    LocalAuthService.getUsers().then(res => setUsers(res || [])).catch(() => {});
  }, []);

  const handleCreateTask = async () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'يرجى كتابة عنوان المهمة' });
      return;
    }

    try {
      const sessionStr = localStorage.getItem('dubsar_session');
      const currentUser = sessionStr ? JSON.parse(sessionStr) : undefined;

      await TaskService.createTask({
        title,
        description,
        assignedTo,
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        status: 'pending'
      }, currentUser);

      toast({ title: 'تم إضافة المهمة بنجاح' });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setPriority('medium');
      setDueDate('');
      loadTasks();
    } catch (e: any) {
      toast({ variant: 'destructive', title: e.message || 'فشل إضافة المهمة' });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: TaskItem['status']) => {
    try {
      const target = tasks.find(t => t.id === id);
      if (!target) return;

      const sessionStr = localStorage.getItem('dubsar_session');
      const currentUser = sessionStr ? JSON.parse(sessionStr) : undefined;

      await TaskService.updateTask(id, { ...target, status: newStatus }, currentUser);
      toast({ title: 'تم تحديث حالة المهمة' });
      loadTasks();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل تحديث المهمة' });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('هل أنت تأكد من حذف هذه المهمة؟')) return;

    try {
      const sessionStr = localStorage.getItem('dubsar_session');
      const currentUser = sessionStr ? JSON.parse(sessionStr) : undefined;

      await TaskService.deleteTask(id, currentUser);
      toast({ title: 'تم حذف المهمة بنجاح' });
      loadTasks();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل حذف المهمة' });
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const getPriorityBadge = (p: TaskItem['priority']) => {
    switch (p) {
      case 'urgent': return <Badge className="bg-red-500 text-white font-bold text-[10px]">عاجل جداً</Badge>;
      case 'high': return <Badge className="bg-amber-500 text-white font-bold text-[10px]">عالي</Badge>;
      case 'medium': return <Badge className="bg-blue-500 text-white font-bold text-[10px]">متوسط</Badge>;
      default: return <Badge variant="secondary" className="font-bold text-[10px]">منخفض</Badge>;
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-16" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            <span>المهام والتكليفات اليومية</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            إدارة مهام الموظفين وتتبع حالة الإنجاز في النظام
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2 bg-primary text-white">
              <Plus className="h-4 w-4" />
              <span>إضافة مهمة جديدة</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-black text-lg text-right">إضافة مهمة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">عنوان المهمة *</label>
                <Input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: جرد الرفوف الخارجية"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">تفاصيل المهمة</label>
                <Textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="تفاصيل إضافية للموظف..."
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">تدمج لـ (الموظف)</label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="جميع الموظفين">جميع الموظفين</SelectItem>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.displayName || u.username}>
                          {u.displayName || u.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الأولوية</label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة جداً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">تاريخ الاستحقاق</label>
                <Input 
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button onClick={handleCreateTask} className="w-full font-bold bg-primary text-white">حفظ المهمة</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button 
          variant={statusFilter === 'all' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setStatusFilter('all')}
          className="rounded-xl text-xs font-bold"
        >
          الكل ({tasks.length})
        </Button>
        <Button 
          variant={statusFilter === 'pending' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setStatusFilter('pending')}
          className="rounded-xl text-xs font-bold"
        >
          قيد الانتظار ({tasks.filter(t => t.status === 'pending').length})
        </Button>
        <Button 
          variant={statusFilter === 'in_progress' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setStatusFilter('in_progress')}
          className="rounded-xl text-xs font-bold"
        >
          قيد التنفيذ ({tasks.filter(t => t.status === 'in_progress').length})
        </Button>
        <Button 
          variant={statusFilter === 'completed' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setStatusFilter('completed')}
          className="rounded-xl text-xs font-bold"
        >
          مكتملة ({tasks.filter(t => t.status === 'completed').length})
        </Button>
      </div>

      {/* Task List Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-40" />
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
            <Card key={task.id} className="rounded-2xl border shadow-sm bg-white dark:bg-slate-900 flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-black leading-snug">{task.title}</CardTitle>
                  {getPriorityBadge(task.priority)}
                </div>
                {task.description && (
                  <CardDescription className="text-xs mt-1 line-clamp-2">{task.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-2 border-t">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>{task.assignedTo || 'غير محدد'}</span>
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" />
                      <span>{new Date(task.dueDate).toLocaleDateString('ar-IQ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1">
                    {task.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                        className="h-7 text-[11px] font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        بدء العمل
                      </Button>
                    )}
                    {task.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateStatus(task.id, 'completed')}
                        className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        إنجاز
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 font-black text-[10px]">
                        مكتملة
                      </Badge>
                    )}
                  </div>

                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleDeleteTask(task.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed bg-slate-50/50 dark:bg-slate-900/50">
          <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto opacity-30 mb-2" />
          <p className="font-black text-sm text-slate-700 dark:text-slate-300">لا توجد مهام مطابقة</p>
          <p className="text-xs text-muted-foreground mt-0.5">قم بإضافة مهمة جديدة لمتابعة أعمال الفريق</p>
        </div>
      )}
    </div>
  );
}

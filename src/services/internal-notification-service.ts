'use client';

import { InventoryService } from './inventory-service';
import { TaskService } from './task-service';
import { POSService } from './pos-service';

export interface InternalNotification {
  id: string;
  type: 'stock' | 'debt' | 'task' | 'system';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  link: string;
  actionText: string;
  read?: boolean;
}

export class InternalNotificationService {
  private static readIdsKey = 'dubsar_read_notifications';

  private static getReadIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(this.readIdsKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static markAsRead(id: string) {
    if (typeof window === 'undefined') return;
    try {
      const readIds = this.getReadIds();
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem(this.readIdsKey, JSON.stringify(readIds));
      }
    } catch (e) {
      console.error(e);
    }
  }

  static markAllAsRead(ids: string[]) {
    if (typeof window === 'undefined') return;
    try {
      const readIds = Array.from(new Set([...this.getReadIds(), ...ids]));
      localStorage.setItem(this.readIdsKey, JSON.stringify(readIds));
    } catch (e) {
      console.error(e);
    }
  }

  static async getSystemNotifications(): Promise<InternalNotification[]> {
    const notifications: InternalNotification[] = [];
    const readIds = this.getReadIds();

    try {
      // 1. Check Low Stock Products
      const products = await InventoryService.getProducts().catch(() => []);
      if (Array.isArray(products)) {
        products.forEach((p: any) => {
          const stock = Number(p.stockQuantity) || 0;
          const min = Number(p.minStockLevel) || 5;

          if (stock <= 0) {
            notifications.push({
              id: `stock-empty-${p.id}`,
              type: 'stock',
              severity: 'critical',
              title: `نفاد مخزون: ${p.name}`,
              message: `المادة نفدت تماماً من المخزن (الكمية الحالية: 0 قطعة). يجب طلب كمية جديدة فوراً.`,
              timestamp: Number(p.updatedAt) || Date.now(),
              link: '/admin/purchases/new',
              actionText: 'إصدار فاتورة شراء',
              read: readIds.includes(`stock-empty-${p.id}`)
            });
          } else if (stock <= min) {
            notifications.push({
              id: `stock-low-${p.id}`,
              type: 'stock',
              severity: 'warning',
              title: `نقص مخزون وشيك: ${p.name}`,
              message: `المتبقي في المخزن (${stock} قطعة) وهو أقل من الحد الأدنى (${min} قطع).`,
              timestamp: Number(p.updatedAt) || Date.now(),
              link: '/admin/inventory',
              actionText: 'معاينة المخزن',
              read: readIds.includes(`stock-low-${p.id}`)
            });
          }
        });
      }

      // 2. Check Customer Debts
      const customers = await InventoryService.getCustomers().catch(() => []);
      if (Array.isArray(customers)) {
        customers.forEach((c: any) => {
          const balance = Number(c.balance) || 0;
          if (balance > 100000) {
            notifications.push({
              id: `debt-${c.id}`,
              type: 'debt',
              severity: 'warning',
              title: `رصيد ذمة مستحق: ${c.name}`,
              message: `يوجد رصيد ذمة مطلوب على العميل بقيمة ${balance.toLocaleString()} د.ع.`,
              timestamp: Date.now(),
              link: '/admin/customers',
              actionText: 'ملف العميل والديون',
              read: readIds.includes(`debt-${c.id}`)
            });
          }
        });
      }

      // 3. Check Pending Tasks
      const tasks = await TaskService.getTasks().catch(() => []);
      if (Array.isArray(tasks)) {
        tasks.forEach((t: any) => {
          if (t.status === 'pending' && t.priority === 'high') {
            notifications.push({
              id: `task-urgent-${t.id}`,
              type: 'task',
              severity: 'critical',
              title: `مهمة مستعجلة: ${t.title}`,
              message: t.description || 'مهمة إدارية ذات أولوية قصوى بانتظار الإنجاز.',
              timestamp: Number(t.createdAt) || Date.now(),
              link: '/admin/tasks',
              actionText: 'عرض المهام',
              read: readIds.includes(`task-urgent-${t.id}`)
            });
          }
        });
      }
    } catch (e) {
      console.error("Error generating internal notifications:", e);
    }

    // Sort notifications: critical first, then newest
    return notifications.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return b.timestamp - a.timestamp;
    });
  }
}

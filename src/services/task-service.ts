import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export class TaskService {
  private static adapter = AdapterFactory.getAdapter();

  static async getTasks(): Promise<TaskItem[]> {
    return await this.adapter.query(DB_COMMANDS.GET_TASKS);
  }

  static async createTask(task: Partial<TaskItem>, user?: { id?: string; displayName?: string; username?: string }) {
    const safeUser = user || { displayName: 'مدير النظام' };
    return await this.adapter.execute(DB_COMMANDS.CREATE_TASK, { task, user: safeUser });
  }

  static async updateTask(id: string, task: Partial<TaskItem>, user?: { id?: string; displayName?: string; username?: string }) {
    const safeUser = user || { displayName: 'مدير النظام' };
    return await this.adapter.execute(DB_COMMANDS.UPDATE_TASK, { id, task, user: safeUser });
  }

  static async deleteTask(id: string, user?: { id?: string; displayName?: string; username?: string }) {
    const safeUser = user || { displayName: 'مدير النظام' };
    return await this.adapter.execute(DB_COMMANDS.DELETE_TASK, { id, user: safeUser });
  }
}

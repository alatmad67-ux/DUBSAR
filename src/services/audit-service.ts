
import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';

export class AuditService {
  private static adapter = AdapterFactory.getAdapter();

  static async log(action: string, module: string, details: string, user?: { id: string, name: string }) {
    return await this.adapter.execute(DB_COMMANDS.LOG_AUDIT, {
      action,
      module,
      details,
      user: user?.name || 'النظام',
    });
  }

  static async getRecentLogs(count = 50) {
    return await this.adapter.query(DB_COMMANDS.GET_AUDIT_LOGS, { count });
  }
}


'use client';

import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';

/**
 * @fileOverview POS Service for DUBSAR 2.0 Desktop.
 * Uses Unified Adapter Pattern for both Preview and Production.
 */
export class POSService {
  private static adapter = AdapterFactory.getAdapter();

  static async processSale(cart: any[], customer: any, payment: any, user: any) {
    return await this.adapter.execute(DB_COMMANDS.PROCESS_SALE, {
      cart,
      customer,
      payment,
      user: {
        id: user?.id,
        displayName: user?.displayName || user?.userName || 'النظام',
        role: user?.role,
        permissions: Array.isArray(user?.permissions) ? user.permissions : [],
      }
    });
  }

  static async updateSale(id: string, cart: any[], customer: any, payment: any, user: any) {
    return await this.adapter.execute(DB_COMMANDS.UPDATE_SALE, {
      id,
      cart,
      customer,
      payment,
      user: {
        id: user?.id,
        displayName: user?.displayName || user?.userName || 'النظام',
        role: user?.role,
        permissions: Array.isArray(user?.permissions) ? user.permissions : [],
      }
    });
  }

  static async getRecentSales() {
    return await this.adapter.query(DB_COMMANDS.GET_SALES);
  }
}


'use client';

import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';

/**
 * @fileOverview Local Authentication Service v2.1.
 */

export interface LocalUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  permissions: string[];
}

export class LocalAuthService {
  private static adapter = AdapterFactory.getAdapter();

  static async ensureOwnerExists() {
    return await this.adapter.execute(DB_COMMANDS.GET_SETUP_STATUS);
  }

  static async createFirstAdmin(username: string, displayName: string, pin: string) {
    return await this.adapter.execute(DB_COMMANDS.CREATE_FIRST_ADMIN, {
      username,
      displayName,
      pin,
    });
  }

  static async getSetupStatus() {
    return await this.adapter.execute(DB_COMMANDS.GET_SETUP_STATUS);
  }

  static async getAppSettings() {
    return await this.adapter.execute(DB_COMMANDS.GET_APP_SETTINGS);
  }

  static async saveAppSettings(settings: Record<string, string>) {
    return await this.adapter.execute(DB_COMMANDS.SAVE_APP_SETTINGS, { settings });
  }

  static async login(username: string, pin: string): Promise<LocalUser | null> {
    const user = await this.adapter.execute(DB_COMMANDS.LOGIN, { username, pin });
    if (user) {
      await this.adapter.execute(DB_COMMANDS.LOG_AUDIT, {
        action: 'تسجيل دخول',
        details: `المستخدم: ${username}`,
        user: user.displayName,
      });
    }
    return user;
  }

  static async getUsers() {
    return await this.adapter.query(DB_COMMANDS.GET_USERS);
  }

  static async createUser(data: any) {
    return await this.adapter.execute(DB_COMMANDS.CREATE_USER, { user: data });
  }

  static async deleteUser(id: string) {
    return await this.adapter.execute(DB_COMMANDS.DELETE_USER, { id });
  }
}

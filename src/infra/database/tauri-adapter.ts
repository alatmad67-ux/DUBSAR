
'use client';

import { DatabaseAdapter } from './adapter';
import { invoke } from '@tauri-apps/api/core';

/**
 * @fileOverview Tauri-specific implementation of DatabaseAdapter.
 * This file is only imported dynamically to avoid build errors in the browser.
 */
export class TauriDatabaseAdapter implements DatabaseAdapter {
  async execute(command: string, args?: any): Promise<any> {
    try {
      return await invoke(command, args);
    } catch (error) {
      console.error(`[Tauri Exec Error] ${command}:`, error);
      throw error;
    }
  }

  async query(command: string, args?: any): Promise<any[]> {
    const result = await this.execute(command, args);
    if (!Array.isArray(result)) {
      throw new Error(`Command ${command} returned an invalid list response`);
    }
    return result;
  }
}

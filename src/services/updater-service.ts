/**
 * @fileOverview DUBSAR 2.0 Official Tauri 2 Updater Service
 * Handles checking, downloading, and applying official updates without touching
 * customer SQLite data or AppData local database.
 */

export interface UpdateCheckResult {
  available: boolean;
  currentVersion: string;
  version?: string;
  date?: string;
  body?: string;
  error?: string;
}

export class UpdaterService {
  private static cachedUpdate: any = null;

  static async checkForUpdates(): Promise<UpdateCheckResult> {
    let currentAppVersion = '2.0.3';
    try {
      const isDesktop = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
      if (!isDesktop) {
        return {
          available: false,
          currentVersion: currentAppVersion,
          error: 'التحديث التلقائي متاح حصرياً في نسخة سطح المكتب لنظام Windows.'
        };
      }

      try {
        const { getVersion } = await import('@tauri-apps/api/app');
        currentAppVersion = await getVersion();
      } catch {
        // Fallback to default version if getVersion is unavailable
      }

      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      this.cachedUpdate = update;

      if (update) {
        return {
          available: true,
          currentVersion: update.currentVersion || currentAppVersion,
          version: update.version,
          date: update.date,
          body: update.body || 'تحسينات جديدة وتحديثات أداء لنظام DUBSAR 2.0'
        };
      } else {
        return {
          available: false,
          currentVersion: currentAppVersion
        };
      }
    } catch (err: any) {
      console.warn('[UpdaterService] Check error:', err);
      return {
        available: false,
        currentVersion: currentAppVersion,
        error: err?.message || String(err)
      };
    }
  }

  static async downloadAndInstall(
    onProgress?: (progressPercent: number, downloadedBytes: number, totalBytes: number) => void
  ): Promise<void> {
    const isDesktop = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    if (!isDesktop) {
      throw new Error('التحديث متاح فقط داخل تطبيق Windows');
    }

    let update = this.cachedUpdate;
    if (!update) {
      const { check } = await import('@tauri-apps/plugin-updater');
      update = await check();
      this.cachedUpdate = update;
    }

    if (!update) {
      throw new Error('لا يوجد تحديث متاح للتثبيت');
    }

    let downloaded = 0;
    let contentLength = 0;

    await update.downloadAndInstall((event: any) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength || 0;
          if (onProgress) onProgress(0, 0, contentLength);
          break;
        case 'Progress':
          downloaded += event.data.chunkLength || 0;
          const percent = contentLength > 0 ? Math.round((downloaded / contentLength) * 100) : 0;
          if (onProgress) onProgress(percent, downloaded, contentLength);
          break;
        case 'Finished':
          if (onProgress) onProgress(100, downloaded, contentLength);
          break;
      }
    });

    // Relaunch app cleanly using native restart
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('app_relaunch');
    } catch {
      window.location.reload();
    }
  }
}

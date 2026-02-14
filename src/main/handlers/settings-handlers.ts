import { ipcMain, app } from 'electron';
import log from 'electron-log';
import * as db from '../database';

export function setupSettingsHandlers(): void {
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = db.getAllSettings();
      return { success: true, data: settings };
    } catch (error: any) {
      log.error('Error getting settings:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    try {
      db.setSetting(key, value);
      return { success: true };
    } catch (error: any) {
      log.error('Error setting:', error);
      return { success: false, error: error.message };
    }
  });

  // Utility handlers
  ipcMain.handle('app:getPath', async (_event, name: string) => {
    try {
      return { success: true, data: app.getPath(name as any) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  log.info('Settings handlers registered');
}

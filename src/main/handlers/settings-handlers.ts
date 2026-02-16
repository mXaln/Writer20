import {ipcMain} from 'electron';
import log from 'electron-log';
import * as Settings from '../business/settings';

export function setupSettingsHandlers(): void {
  ipcMain.handle('settings:list', async () => {
    return Settings.list();
  });

  ipcMain.handle('settings:get', async (_event, key: string) => {
    return Settings.get(key);
  });

  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    return Settings.set(key, value);
  });

  log.info('Settings handlers registered');
}

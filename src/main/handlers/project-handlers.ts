import {ipcMain} from 'electron';
import log from 'electron-log';
import * as Projects from '../business/projects';

export function setupProjectHandlers(): void {
  ipcMain.handle('project:create', async (_event, language: string, book: string, type: string) => {
    return Projects.create(language, book, type);
  });

  ipcMain.handle('project:list', async () => {
    return Projects.list();
  });

  ipcMain.handle('project:get', async (_event, id: number) => {
    return Projects.get(id);
  });

  ipcMain.handle('project:delete', async (_event, id: number) => {
    return Projects.remove(id);
  });

  ipcMain.handle('project:export', async (_event, id: number) => {
    return Projects.doExport(id);
  });

  ipcMain.handle('project:import', async () => {
    return Projects.doImport();
  });

  log.info('Project handlers registered');
}

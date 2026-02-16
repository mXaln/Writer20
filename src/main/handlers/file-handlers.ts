import {ipcMain} from 'electron';
import log from 'electron-log';
import * as Files from '../business/files';

export function setupFileHandlers(): void {
  ipcMain.handle('file:create', async (_event, projectId: number) => {
    return Files.create(projectId);
  });

  ipcMain.handle('file:read', async (_event, filePath: string) => {
    return Files.read(filePath);
  });

  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    return Files.write(filePath, content);
  });

  ipcMain.handle('file:list', async (_event, projectId: number) => {
    return Files.list(projectId);
  });

  // New handler: prepopulate 100 items, load content only if file exists
  ipcMain.handle('file:listWithContent', async (_event, projectId: number) => {
    return Files.listWithContent(projectId);
  });

  ipcMain.handle('file:open', async (_event, filePath: string) => {
    return Files.open(filePath);
  });

  ipcMain.handle('file:remove', async (_event, filePath: string, deleteFromDisk: boolean = true) => {
    return Files.remove(filePath, deleteFromDisk);
  });

  // Conflict resolution handlers
  ipcMain.handle('file:getConflictedFiles', async (_event, projectId: number) => {
    return { success: true, data: Files.getConflictedFiles(projectId) };
  });

  ipcMain.handle('file:resolveConflict', async (_event, filePath: string, acceptedContent: string, projectId: number) => {
    return Files.resolveConflict(filePath, acceptedContent, projectId);
  });

  log.info('File handlers registered');
}

import {BrowserWindow, dialog, ipcMain} from 'electron';
import log from 'electron-log';
import * as Projects from '../business/projects';
import {msg} from "@lit/localize";
import {ErrorCode} from "../error-codes";

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
    const projectResult = Projects.get(id);
    if (!projectResult.success || !projectResult.data) {
      return { success: false, error: ErrorCode.PROJECT_NOT_FOUND };
    }

    const project = projectResult.data;
    const win = BrowserWindow.fromWebContents(_event.sender);

    const result = await dialog.showSaveDialog(win!, {
      title: msg('Export Project as ZIP'),
      defaultPath: `${project.name}.zip`,
      filters: [{ name: msg('ZIP Files'), extensions: ['zip'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: true, canceled: true };
    }

    return Projects.exportProject(project, result.filePath);
  });

  ipcMain.handle('project:import', async (_event) => {
    const win = BrowserWindow.fromWebContents(_event.sender);

    const result = await dialog.showOpenDialog(win!, {
      title: msg('Import Project from ZIP'),
      filters: [{ name: msg('ZIP Files'), extensions: ['zip'] }],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, canceled: true };
    }

    const importResult: any = await Projects.importProject(result.filePaths[0]);
    
    // If there are conflicts, include the zip path so we can retry with different options
    if (importResult.success && importResult.data && typeof importResult.data === 'object' && 'hasConflicts' in importResult.data) {
      importResult.data.zipPath = result.filePaths[0];
    }
    
    return importResult;
  });

  ipcMain.handle('project:importWithOption', async (_event, projectId: number, zipPath: string, option: 'overwrite' | 'merge' | 'cancel') => {
    return Projects.importWithOption(projectId, zipPath, option);
  });

  log.info('Project handlers registered');
}

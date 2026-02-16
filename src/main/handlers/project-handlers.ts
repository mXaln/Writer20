import {BrowserWindow, dialog, ipcMain} from 'electron';
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
    const projectResult = Projects.get(id);
    if (!projectResult.success || !projectResult.data) {
      return { success: false, error: 'Project not found' };
    }

    const project = projectResult.data;
    const win = BrowserWindow.fromWebContents(_event.sender);

    const result = await dialog.showSaveDialog(win!, {
      title: 'Export Project as ZIP',
      defaultPath: `${project.name}.zip`,
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: true, canceled: true };
    }

    return Projects.exportProject(project, result.filePath);
  });

  ipcMain.handle('project:import', async (_event) => {
    const win = BrowserWindow.fromWebContents(_event.sender);

    const result = await dialog.showOpenDialog(win!, {
      title: 'Import Project from ZIP',
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, canceled: true };
    }

    return Projects.importProject(result.filePaths[0]);
  });

  log.info('Project handlers registered');
}

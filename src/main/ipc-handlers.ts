import { ipcMain, dialog, shell, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log';
import * as db from './database';

export function setupIpcHandlers(): void {
  // Project handlers
  ipcMain.handle('project:create', async (_event, name: string, description: string) => {
    try {
      log.info(`Creating project: ${name}`);
      
      // Check if project with same name exists
      const existing = db.getProjectByName(name);
      if (existing) {
        return { success: false, error: 'Project with this name already exists' };
      }

      const project = db.createProject(name, description);
      
      // Create project folder in ~/SuperFiles
      const superFilesPath = path.join(app.getPath('home'), 'SuperFiles', name);
      if (!fs.existsSync(superFilesPath)) {
        fs.mkdirSync(superFilesPath, { recursive: true });
        log.info(`Created project folder: ${superFilesPath}`);
      }

      return { success: true, data: project };
    } catch (error: any) {
      log.error('Error creating project:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('project:list', async () => {
    try {
      const projects = db.getAllProjects();
      // Add file count to each project
      return { success: true, data: projects.map(p => ({
        ...p,
        fileCount: db.getProjectFileCount(p.id)
      }))};
    } catch (error: any) {
      log.error('Error listing projects:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('project:get', async (_event, id: number) => {
    try {
      const project = db.getProject(id);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }
      return { 
        success: true, 
        data: {
          ...project,
          fileCount: db.getProjectFileCount(id)
        }
      };
    } catch (error: any) {
      log.error('Error getting project:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('project:delete', async (_event, id: number) => {
    try {
      const project = db.getProject(id);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Delete project folder
      const superFilesPath = path.join(app.getPath('home'), 'SuperFiles', project.name);
      if (fs.existsSync(superFilesPath)) {
        fs.rmSync(superFilesPath, { recursive: true, force: true });
        log.info(`Deleted project folder: ${superFilesPath}`);
      }

      db.deleteProject(id);
      return { success: true };
    } catch (error: any) {
      log.error('Error deleting project:', error);
      return { success: false, error: error.message };
    }
  });

  // File handlers
  ipcMain.handle('file:add', async (_event, projectId: number) => {
    try {
      const project = db.getProject(projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Open file dialog
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        title: 'Select files to add'
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: [] };
      }

      const projectFolder = path.join(app.getPath('home'), 'SuperFiles', project.name);
      const addedFiles: any[] = [];

      for (const filePath of result.filePaths) {
        const fileName = path.basename(filePath);
        const destPath = path.join(projectFolder, fileName);

        // Copy file to project folder
        fs.copyFileSync(filePath, destPath);
        
        // Add to database
        const file = db.addFile(projectId, fileName, destPath);
        addedFiles.push(file);
        log.info(`Added file: ${fileName} to project ${project.name}`);
      }

      return { success: true, data: addedFiles };
    } catch (error: any) {
      log.error('Error adding files:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:create', async (_event, projectId: number) => {
    try {
      const project = db.getProject(projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      const projectFolder = path.join(app.getPath('home'), 'SuperFiles', project.name);
      
      // Get existing files to determine next number
      const existingFiles = db.getProjectFiles(projectId);
      let nextNum = 1;
      
      // Find the next available number
      const existingNumbers = new Set(
        existingFiles
          .map(f => {
            const match = f.name.match(/^(\d+)\.txt$/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter(n => n !== null) as number[]
      );
      
      while (existingNumbers.has(nextNum)) {
        nextNum++;
      }
      
      // Generate filename with zero-padded number
      const fileName = `${String(nextNum).padStart(2, '0')}.txt`;
      const filePath = path.join(projectFolder, fileName);
      
      // Create empty file
      fs.writeFileSync(filePath, '', 'utf-8');
      
      // Add to database
      const file = db.addFile(projectId, fileName, filePath);
      log.info(`Created file: ${fileName} in project ${project.name}`);
      
      return { success: true, data: file };
    } catch (error: any) {
      log.error('Error creating file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:list', async (_event, projectId: number) => {
    try {
      const files = db.getProjectFiles(projectId);
      return { success: true, data: files };
    } catch (error: any) {
      log.error('Error listing files:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:open', async (_event, filePath: string) => {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }

      // Open with system default application
      await shell.openPath(filePath);
      log.info(`Opened file: ${filePath}`);
      return { success: true };
    } catch (error: any) {
      log.error('Error opening file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:remove', async (_event, id: number, deleteFromDisk: boolean = false) => {
    try {
      const file = db.getFile(id);
      if (!file) {
        return { success: false, error: 'File not found' };
      }

      // Optionally delete from disk
      if (deleteFromDisk && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        log.info(`Deleted file from disk: ${file.path}`);
      }

      db.deleteFile(id);
      return { success: true };
    } catch (error: any) {
      log.error('Error removing file:', error);
      return { success: false, error: error.message };
    }
  });

  // Settings handlers
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
}

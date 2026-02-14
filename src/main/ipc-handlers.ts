import { ipcMain, dialog, shell, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log';
import * as db from './database';

export function setupIpcHandlers(): void {
  // Project handlers
  ipcMain.handle('project:create', async (_event, language: string, book: string, type: string) => {
    try {
      // Check if project with same language/book/type exists
      const existing = db.getProjectByLanguageBookType(language, book, type);
      if (existing) {
        return { success: false, error: 'Project with this identifier already exists' };
      }
      
      // Create project in database
      const project = db.createProject(language, book, type);
      log.info(`Creating project: ${project.name}`);
      
      // Create project folder in ~/SuperFiles using project.name
      const superFilesPath = path.join(app.getPath('home'), 'SuperFiles', project.name);
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
      return { success: true, data: projects };
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
      return { success: true, data: project };
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

  ipcMain.handle('project:export', async (_event, id: number) => {
    try {
      const project = db.getProject(id);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      const projectFolder = path.join(app.getPath('home'), 'SuperFiles', project.name);
      if (!fs.existsSync(projectFolder)) {
        return { success: false, error: 'Project folder not found' };
      }

      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export Project as ZIP',
        defaultPath: `${project.name}.zip`,
        filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
      });

      if (result.canceled || !result.filePath) {
        return { success: true, data: null };
      }

      // Create zip file
      const archiver = require('archiver');
      const output = fs.createWriteStream(result.filePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve) => {
        output.on('close', () => {
          log.info(`Exported project ${project.name} to ${result.filePath}`);
          resolve({ success: true, data: result.filePath });
        });

        archive.on('error', (err: any) => {
          log.error('Error creating zip:', err);
          resolve({ success: false, error: err.message });
        });

        archive.pipe(output);
        archive.directory(projectFolder, false);
        archive.finalize();
      });
    } catch (error: any) {
      log.error('Error exporting project:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('project:import', async () => {
    try {
      // Show open dialog to select ZIP file
      const result = await dialog.showOpenDialog({
        title: 'Import Project from ZIP',
        filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: null };
      }

      const zipPath = result.filePaths[0];
      const fileName = path.basename(zipPath, '.zip');
      
      // Parse filename to extract language/book/type
      // Expected format: language_book_text_type or language_book_type
      const parts = fileName.split('_');
      let language = fileName;
      let book = 'mat';
      let type = 'ulb';
      
      if (parts.length >= 1) language = parts[0];
      if (parts.length >= 2) book = parts[1];
      if (parts.length >= 4) type = parts[3]; // language_book_text_type

      // Check if project with same language/book/type exists
      const existing = db.getProjectByLanguageBookType(language, book, type);
      if (existing) {
        return { success: false, error: 'Project with this identifier already exists' };
      }

      // Create project in database
      const project = db.createProject(language, book, type);
      
      // Create project folder using the generated project name
      const projectFolder = path.join(app.getPath('home'), 'SuperFiles', project.name);
      if (!fs.existsSync(projectFolder)) {
        fs.mkdirSync(projectFolder, { recursive: true });
      }

      // Extract ZIP file
      const extract = require('extract-zip');
      await extract(zipPath, { dir: projectFolder });
      
      log.info(`Imported project ${fileName} from ${zipPath}`);
      
      return { success: true, data: project };
    } catch (error: any) {
      log.error('Error importing project:', error);
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
      
      // Get existing files from filesystem
      const existingFiles = fs.readdirSync(projectFolder)
        .filter(f => fs.statSync(path.join(projectFolder, f)).isFile());
      
      let nextNum = 1;
      
      // Find the next available number
      const existingNumbers = new Set(
        existingFiles
          .map((f: string) => {
            const match = f.match(/^(\d+)\.txt$/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter((n: number | null): n is number => n !== null)
      );
      
      while (existingNumbers.has(nextNum)) {
        nextNum++;
      }
      
      // Generate filename with zero-padded number
      const fileName = `${String(nextNum).padStart(2, '0')}.txt`;
      const filePath = path.join(projectFolder, fileName);
      
      // Create empty file
      fs.writeFileSync(filePath, '', 'utf-8');
      
      log.info(`Created file: ${fileName} in project ${project.name}`);
      
      return { success: true, data: { id: fileName, name: fileName, path: filePath } };
    } catch (error: any) {
      log.error('Error creating file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: content };
    } catch (error: any) {
      log.error('Error reading file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      log.info(`Saved file: ${filePath}`);
      return { success: true };
    } catch (error: any) {
      log.error('Error writing file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:list', async (_event, projectId: number) => {
    try {
      const project = db.getProject(projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      const projectFolder = path.join(app.getPath('home'), 'SuperFiles', project.name);
      if (!fs.existsSync(projectFolder)) {
        return { success: true, data: [] };
      }

      const files = fs.readdirSync(projectFolder)
        .filter(f => fs.statSync(path.join(projectFolder, f)).isFile())
        .map(f => ({
          id: f,
          name: f,
          path: path.join(projectFolder, f)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

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

  ipcMain.handle('file:remove', async (_event, filePath: string, deleteFromDisk: boolean = true) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }

      // Delete from disk
      if (deleteFromDisk) {
        fs.unlinkSync(filePath);
        log.info(`Deleted file from disk: ${filePath}`);
      }

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

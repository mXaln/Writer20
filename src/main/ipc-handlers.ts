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

      // Create manifest.json file
      const manifest = {
        package_version: 1,
        format: "usfm",
        generator: {
          name: "superfiles",
          build: "1"
        },
        target_language: {
          id: language
        },
        project: {
          id: book
        },
        type: {
          id: "text",
          name: "Text"
        },
        resource: {
          id: type,
          name: type
        }
      };
      const manifestPath = path.join(superFilesPath, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      log.info(`Created manifest.json: ${manifestPath}`);

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
      
      // Create temp folder for extraction
      const tempFolder = path.join(app.getPath('temp'), `superfiles-import-${Date.now()}`);
      fs.mkdirSync(tempFolder, { recursive: true });

      // Extract ZIP file
      const extract = require('extract-zip');
      await extract(zipPath, { dir: tempFolder });
      
      // Look for manifest.json in extracted content
      const manifestPath = path.join(tempFolder, 'manifest.json');
      let language = 'en';
      let book = 'mat';
      let resource = 'ulb';
      
      if (fs.existsSync(manifestPath)) {
        const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        
        if (manifest.target_language?.id) {
          language = manifest.target_language.id;
        }
        if (manifest.project?.id) {
          book = manifest.project.id;
        }
        if (manifest.resource?.id) {
          resource = manifest.resource.id;
        }
      }

      // Check if project with same language/book/resource exists
      const existing = db.getProjectByLanguageBookType(language, book, resource);
      if (existing) {
        // Cleanup temp folder
        fs.rmSync(tempFolder, { recursive: true, force: true });
        return { success: false, error: 'Project with this identifier already exists' };
      }

      // Create project in database
      const project = db.createProject(language, book, resource);
      
      // Create project folder
      const projectFolder = path.join(app.getPath('home'), 'SuperFiles', project.name);
      if (!fs.existsSync(projectFolder)) {
        fs.mkdirSync(projectFolder, { recursive: true });
      }

      // Create contents folder
      const contentsFolder = path.join(projectFolder, 'contents');
      if (!fs.existsSync(contentsFolder)) {
        fs.mkdirSync(contentsFolder, { recursive: true });
      }

      // Move files from temp to contents folder
      const tempContentsFolder = path.join(tempFolder, 'contents');
      if (fs.existsSync(tempContentsFolder)) {
        // If ZIP has contents folder, copy from there
        const files = fs.readdirSync(tempContentsFolder);
        for (const file of files) {
          const srcPath = path.join(tempContentsFolder, file);
          const destPath = path.join(contentsFolder, file);
          fs.copyFileSync(srcPath, destPath);
        }
      } else {
        // Otherwise, copy from root of temp folder (skip manifest)
        const files = fs.readdirSync(tempFolder);
        for (const file of files) {
          if (file !== 'manifest.json') {
            const srcPath = path.join(tempFolder, file);
            const destPath = path.join(contentsFolder, file);
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      
      // Cleanup temp folder
      fs.rmSync(tempFolder, { recursive: true, force: true });
      
      // Create/update manifest.json
      const newManifestPath = path.join(projectFolder, 'manifest.json');
      const manifest = {
        package_version: 1,
        format: "usfm",
        generator: {
          name: "superfiles",
          build: "1"
        },
        target_language: {
          id: language
        },
        project: {
          id: book
        },
        type: {
          id: "text",
          name: "Text"
        },
        resource: {
          id: resource,
          name: resource
        }
      };
      fs.writeFileSync(newManifestPath, JSON.stringify(manifest, null, 2));
      
      log.info(`Imported project ${project.name} from ${zipPath}`);
      
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
      const contentsFolder = path.join(projectFolder, 'contents');
      
      // Create contents folder if it doesn't exist
      if (!fs.existsSync(contentsFolder)) {
        fs.mkdirSync(contentsFolder, { recursive: true });
      }
      
      // Get existing files from contents folder
      const existingFiles = fs.readdirSync(contentsFolder)
        .filter(f => fs.statSync(path.join(contentsFolder, f)).isFile());
      
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
      const filePath = path.join(contentsFolder, fileName);
      
      // Create empty file
      fs.writeFileSync(filePath, '', 'utf-8');
      
      log.info(`Created file: ${fileName} in project ${project.name}/contents`);
      
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
      // Only write if:
      // 1. Content is non-empty, OR
      // 2. File already exists (preserve existing content)
      const fileExists = fs.existsSync(filePath);
      
      if (content.trim() || fileExists) {
        fs.writeFileSync(filePath, content, 'utf-8');
        log.info(`Saved file: ${filePath}`);
      }
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
      const contentsFolder = path.join(projectFolder, 'contents');
      
      if (!fs.existsSync(contentsFolder)) {
        return { success: true, data: [] };
      }

      const files = fs.readdirSync(contentsFolder)
        .filter(f => fs.statSync(path.join(contentsFolder, f)).isFile())
        .map(f => ({
          id: f,
          name: f,
          path: path.join(contentsFolder, f)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return { success: true, data: files };
    } catch (error: any) {
      log.error('Error listing files:', error);
      return { success: false, error: error.message };
    }
  });

  // New handler: prepopulate 100 items, load content only if file exists
  ipcMain.handle('file:listWithContent', async (_event, projectId: number) => {
    try {
      const project = db.getProject(projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      const projectFolder = path.join(app.getPath('home'), 'SuperFiles', project.name);
      const contentsFolder = path.join(projectFolder, 'contents');
      
      // Ensure contents folder exists
      if (!fs.existsSync(contentsFolder)) {
        fs.mkdirSync(contentsFolder, { recursive: true });
      }

      // Generate 100 items
      const items = [];
      for (let i = 1; i <= 100; i++) {
        const fileName = `${String(i).padStart(2, '0')}.txt`;
        const filePath = path.join(contentsFolder, fileName);
        
        // Read content if file exists
        let content = '';
        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf-8');
        }
        
        items.push({
          id: fileName,
          name: fileName,
          path: filePath,
          content: content
        });
      }

      return { success: true, data: items };
    } catch (error: any) {
      log.error('Error listing files with content:', error);
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

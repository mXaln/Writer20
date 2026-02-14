import { ipcMain, shell, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log';
import * as db from '../database';
import simpleGit from 'simple-git';

export function setupFileHandlers(): void {
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
      // Extract project folder from file path
      const projectFolder = path.dirname(path.dirname(filePath));
      const fileName = path.basename(filePath);
      const relativePath = path.join('contents', fileName);
      
      const fileExistedBefore = fs.existsSync(filePath);
      
      // Write file regardless
      fs.writeFileSync(filePath, content, 'utf-8');
      log.info(`Saved file: ${filePath}`);
      
      // Commit changes to git if content is not empty or file didn't exist
      if (content.trim() || !fileExistedBefore) {
        try {
          const git = simpleGit(projectFolder);
          await git.add(relativePath);
          await git.commit(`Update ${fileName}`);
          log.info(`Committed: ${fileName}`);
        } catch (gitError: any) {
          log.error(`Git error: ${gitError.message}`);
        }
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
      const items: Array<{id: string; name: string; path: string; content: string}> = [];
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

  log.info('File handlers registered');
}

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Project operations
  createProject: (name: string, description: string) =>
    ipcRenderer.invoke('project:create', name, description),
  listProjects: () =>
    ipcRenderer.invoke('project:list'),
  getProject: (id: number) =>
    ipcRenderer.invoke('project:get', id),
  deleteProject: (id: number) =>
    ipcRenderer.invoke('project:delete', id),

  // File operations
  addFiles: (projectId: number) =>
    ipcRenderer.invoke('file:add', projectId),
  createFile: (projectId: number) =>
    ipcRenderer.invoke('file:create', projectId),
  listFiles: (projectId: number) =>
    ipcRenderer.invoke('file:list', projectId),
  openFile: (filePath: string) =>
    ipcRenderer.invoke('file:open', filePath),
  removeFile: (id: number, deleteFromDisk: boolean) =>
    ipcRenderer.invoke('file:remove', id, deleteFromDisk),

  // Settings
  getSettings: () =>
    ipcRenderer.invoke('settings:get'),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke('settings:set', key, value),

  // Utility
  getPath: (name: string) =>
    ipcRenderer.invoke('app:getPath', name),
});

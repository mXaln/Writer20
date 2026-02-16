import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Project operations
  createProject: (language: string, book: string, type: string) =>
    ipcRenderer.invoke('project:create', language, book, type),
  listProjects: () =>
    ipcRenderer.invoke('project:list'),
  getProject: (id: number) =>
    ipcRenderer.invoke('project:get', id),
  deleteProject: (id: number) =>
    ipcRenderer.invoke('project:delete', id),
  exportProject: (id: number) =>
    ipcRenderer.invoke('project:export', id),
  importProject: () =>
    ipcRenderer.invoke('project:import'),
  resolveConflict: (filePath: string, acceptedContent: string) =>
    ipcRenderer.invoke('project:resolveConflict', filePath, acceptedContent),

  // File operations
  addFiles: (projectId: number) =>
    ipcRenderer.invoke('file:add', projectId),
  createFile: (projectId: number) =>
    ipcRenderer.invoke('file:create', projectId),
  readFile: (filePath: string) =>
    ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('file:write', filePath, content),
  listFiles: (projectId: number) =>
    ipcRenderer.invoke('file:list', projectId),
  listFilesWithContent: (projectId: number) =>
    ipcRenderer.invoke('file:listWithContent', projectId),
  openFile: (filePath: string) =>
    ipcRenderer.invoke('file:open', filePath),
  removeFile: (filePath: string, deleteFromDisk: boolean) =>
    ipcRenderer.invoke('file:remove', filePath, deleteFromDisk),

  // Settings
  getSettings: () =>
    ipcRenderer.invoke('settings:list'),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke('settings:set', key, value),

  // Utility
  getPath: (name: string) =>
    ipcRenderer.invoke('app:getPath', name),
});

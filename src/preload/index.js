import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Project operations
    createProject: (language, book, type) => ipcRenderer.invoke('project:create', language, book, type),
    listProjects: () => ipcRenderer.invoke('project:list'),
    getProject: (id) => ipcRenderer.invoke('project:get', id),
    deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
    exportProject: (id) => ipcRenderer.invoke('project:export', id),
    importProject: () => ipcRenderer.invoke('project:import'),
    // File operations
    addFiles: (projectId) => ipcRenderer.invoke('file:add', projectId),
    createFile: (projectId) => ipcRenderer.invoke('file:create', projectId),
    readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
    listFiles: (projectId) => ipcRenderer.invoke('file:list', projectId),
    listFilesWithContent: (projectId) => ipcRenderer.invoke('file:listWithContent', projectId),
    openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
    removeFile: (filePath, deleteFromDisk) => ipcRenderer.invoke('file:remove', filePath, deleteFromDisk),
    // Settings
    getSettings: () => ipcRenderer.invoke('settings:get'),
    setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    // Utility
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
});

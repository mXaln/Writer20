import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Project operations
    createProject: (name, description) => ipcRenderer.invoke('project:create', name, description),
    listProjects: () => ipcRenderer.invoke('project:list'),
    getProject: (id) => ipcRenderer.invoke('project:get', id),
    deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
    // File operations
    addFiles: (projectId) => ipcRenderer.invoke('file:add', projectId),
    listFiles: (projectId) => ipcRenderer.invoke('file:list', projectId),
    openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
    removeFile: (id, deleteFromDisk) => ipcRenderer.invoke('file:remove', id, deleteFromDisk),
    // Settings
    getSettings: () => ipcRenderer.invoke('settings:get'),
    setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    // Utility
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
});
//# sourceMappingURL=index.js.map
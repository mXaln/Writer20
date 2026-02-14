export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  fileCount?: number;
}

export interface FileItem {
  id: number;
  project_id: number;
  name: string;
  path: string;
  created_at: string;
}

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  language: 'en' | 'ru';
}

export type Theme = 'dark' | 'light' | 'system';
export type Language = 'en' | 'ru';

export interface IpcResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Type for the exposed API from preload
declare global {
  interface Window {
    electronAPI: {
      createProject: (name: string, description: string) => Promise<IpcResult<Project>>;
      listProjects: () => Promise<IpcResult<Project[]>>;
      getProject: (id: number) => Promise<IpcResult<Project>>;
      deleteProject: (id: number) => Promise<IpcResult>;
      addFiles: (projectId: number) => Promise<IpcResult<FileItem[]>>;
      createFile: (projectId: number) => Promise<IpcResult<FileItem>>;
      listFiles: (projectId: number) => Promise<IpcResult<FileItem[]>>;
      openFile: (filePath: string) => Promise<IpcResult>;
      removeFile: (id: number, deleteFromDisk: boolean) => Promise<IpcResult>;
      getSettings: () => Promise<IpcResult<Settings>>;
      setSetting: (key: string, value: string) => Promise<IpcResult>;
      getPath: (name: string) => Promise<IpcResult<string>>;
    };
  }
}

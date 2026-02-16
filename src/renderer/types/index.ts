export interface Project {
  id: number;
  name: string;
  language: string;
  book: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  content?: string;
}

export interface FileConflict {
  fileId: string;
  fileName: string;
  filePath: string;
  currentContent: string;
  importedContent: string;
}

export interface ImportConflictResult {
  hasConflicts: boolean;
  projectId: number;
  conflicts: FileConflict[];
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
      createProject: (language: string, book: string, type: string) => Promise<IpcResult<Project>>;
      listProjects: () => Promise<IpcResult<Project[]>>;
      getProject: (id: number) => Promise<IpcResult<Project>>;
      deleteProject: (id: number) => Promise<IpcResult>;
      exportProject: (id: number) => Promise<IpcResult<string | null>>;
      importProject: () => Promise<IpcResult<Project | ImportConflictResult>>;
      resolveConflict: (filePath: string, acceptedContent: string) => Promise<IpcResult>;
      getConflicts: (projectId: number) => Promise<IpcResult<FileConflict[]>>;
      addFiles: (projectId: number) => Promise<IpcResult<FileItem[]>>;
      createFile: (projectId: number) => Promise<IpcResult<FileItem>>;
      readFile: (filePath: string) => Promise<IpcResult<string>>;
      writeFile: (filePath: string, content: string) => Promise<IpcResult>;
      listFiles: (projectId: number) => Promise<IpcResult<FileItem[]>>;
      listFilesWithContent: (projectId: number) => Promise<IpcResult<FileItem[]>>;
      openFile: (filePath: string) => Promise<IpcResult>;
      removeFile: (filePath: string, deleteFromDisk: boolean) => Promise<IpcResult>;
      getSettings: () => Promise<IpcResult<Settings>>;
      setSetting: (key: string, value: string) => Promise<IpcResult>;
      getPath: (name: string) => Promise<IpcResult<string>>;
    };
  }
}

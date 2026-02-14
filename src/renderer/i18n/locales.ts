import { Language } from '../types';
import {en} from './en';
import {ru} from './ru';

export interface Translations {
  app: {
    name: string;
  };
  nav: {
    dashboard: string;
    workflow: string;
    settings: string;
    importProject: string;
  };
  dashboard: {
    title: string;
    newProject: string;
    noProjects: string;
    createProject: string;
    projectName: string;
    projectDescription: string;
    cancel: string;
    create: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
  };
  projectInfo: {
    title: string;
    files: string;
    close: string;
    description: string;
    delete: string;
    exportProject: string;
    deleteConfirm: string;
  };
  workflow: {
    back: string;
    addFiles: string;
    noFiles: string;
    removeFile: string;
    openFile: string;
    fileNotFound: string;
    fileName: string;
    filePath: string;
    actions: string;
    edit: string;
    save: string;
  };
  settings: {
    title: string;
    appearance: string;
    theme: string;
    dark: string;
    light: string;
    system: string;
    language: string;
    english: string;
    russian: string;
  };
  errors: {
    required: string;
    duplicateName: string;
    fileNotFound: string;
    databaseError: string;
    invalidLanguage: string;
    invalidBook: string;
    invalidType: string;
    failedToExport: string;
    failedToDelete: string;
    failedToSave: string;
  };
}

const translations: Record<Language, Translations> = { en, ru };

export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}

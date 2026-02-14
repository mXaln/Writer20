import { Language } from '../types';

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

const en: Translations = {
  app: {
    name: 'SuperFiles',
  },
  nav: {
    dashboard: 'Dashboard',
    workflow: 'Workflow',
    settings: 'Settings',
    importProject: 'Import Project',
  },
  dashboard: {
    title: 'Projects',
    newProject: 'New Project',
    noProjects: 'No projects yet. Create your first project!',
    createProject: 'Create Project',
    projectName: 'Project Name',
    projectDescription: 'Description',
    cancel: 'Cancel',
    create: 'Create',
    namePlaceholder: 'Enter project name',
    descriptionPlaceholder: 'Enter project description (optional)',
  },
  projectInfo: {
    title: 'Project Info',
    files: 'files',
    close: 'Close',
    description: 'Description',
    delete: 'Delete',
    exportProject: 'Export Project',
    deleteConfirm: 'Are you sure you want to delete',
  },
  workflow: {
    back: 'Back',
    addFiles: 'Add Files',
    noFiles: 'No files yet. Click "Add Files" to get started!',
    removeFile: 'Remove',
    openFile: 'Open',
    fileNotFound: 'File not found',
    fileName: 'Name',
    filePath: 'Path',
    actions: 'Actions',
    edit: 'Edit',
    save: 'Save',
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    system: 'System',
    language: 'Language',
    english: 'English',
    russian: 'Russian',
  },
  errors: {
    required: 'This field is required',
    duplicateName: 'Project with this name already exists',
    fileNotFound: 'File not found',
    databaseError: 'Database error occurred',
    invalidLanguage: 'Language must be lowercase letters, numbers, or hyphens only',
    invalidBook: 'Book must be exactly 3 lowercase letters or numbers',
    invalidType: 'Type must be 1-3 lowercase letters or numbers',
    failedToExport: 'Failed to export project',
    failedToDelete: 'Failed to delete project',
    failedToSave: 'Failed to save file',
  },
};

const ru: Translations = {
  app: {
    name: 'SuperFiles',
  },
  nav: {
    dashboard: 'Главная',
    workflow: 'Рабочая область',
    settings: 'Настройки',
    importProject: 'Импорт проекта',
  },
  dashboard: {
    title: 'Проекты',
    newProject: 'Новый проект',
    noProjects: 'Пока нет проектов. Создайте свой первый проект!',
    createProject: 'Создать проект',
    projectName: 'Название проекта',
    projectDescription: 'Описание',
    cancel: 'Отмена',
    create: 'Создать',
    namePlaceholder: 'Введите название проекта',
    descriptionPlaceholder: 'Введите описание проекта (необязательно)',
  },
  projectInfo: {
    title: 'Информация о проекте',
    files: 'файлов',
    close: 'Закрыть',
    description: 'Описание',
    delete: 'Удалить',
    exportProject: 'Экспорт проекта',
    deleteConfirm: 'Вы уверены, что хотите удалить',
  },
  workflow: {
    back: 'Назад',
    addFiles: 'Добавить файлы',
    noFiles: 'Пока нет файлов. Нажмите "Добавить файлы" чтобы начать!',
    removeFile: 'Удалить',
    openFile: 'Открыть',
    fileNotFound: 'Файл не найден',
    fileName: 'Имя',
    filePath: 'Путь',
    actions: 'Действия',
    edit: 'Редактировать',
    save: 'Сохранить',
  },
  settings: {
    title: 'Настройки',
    appearance: 'Внешний вид',
    theme: 'Тема',
    dark: 'Тёмная',
    light: 'Светлая',
    system: 'Системная',
    language: 'Язык',
    english: 'Английский',
    russian: 'Русский',
  },
  errors: {
    required: 'Это поле обязательно',
    duplicateName: 'Проект с таким названием уже существует',
    fileNotFound: 'Файл не найден',
    databaseError: 'Произошла ошибка базы данных',
    invalidLanguage: 'Язык должен содержать только строчные буквы, цифры или дефисы',
    invalidBook: 'Книга должна быть ровно 3 строчные буквы или цифры',
    invalidType: 'Тип должен быть 1-3 строчные буквы или цифры',
    failedToExport: 'Не удалось экспортировать проект',
    failedToDelete: 'Не удалось удалить проект',
    failedToSave: 'Не удалось сохранить файл',
  },
};

const translations: Record<Language, Translations> = { en, ru };

export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}

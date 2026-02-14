import { Language } from '../types';

export interface Translations {
  app: {
    name: string;
  };
  nav: {
    dashboard: string;
    workflow: string;
    settings: string;
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
  },
};

const translations: Record<Language, Translations> = { en, ru };

export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}

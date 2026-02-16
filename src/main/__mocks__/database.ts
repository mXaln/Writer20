import { vi } from 'vitest';

// Project methods
export const getProject = vi.fn();
export const getProjectByLanguageBookType = vi.fn();
export const createProject = vi.fn();
export const getAllProjects = vi.fn();
export const deleteProject = vi.fn();

// Settings methods
export const getAllSettings = vi.fn();
export const getSetting = vi.fn();
export const setSetting = vi.fn();

// DB management
export const getDatabase = vi.fn();
export const initDatabase = vi.fn();
export const closeDatabase = vi.fn();
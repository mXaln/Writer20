import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as BetterSqlite3Mock from 'better-sqlite3';
const { mockPrepare, mockStatement, mockExec, mockPragma } = BetterSqlite3Mock as any;
import { app } from 'electron';
import {
  initDatabase,
  getDatabase,
  closeDatabase,
  createProject,
  getAllProjects,
  getProject,
  deleteProject,
  getSetting,
  setSetting,
  getAllSettings,
  getProjectByLanguageBookType
} from './database';

// --- MOCKS ---
vi.mock('electron');
vi.mock('electron-log');
vi.mock('fs');
vi.mock('better-sqlite3');

describe('Database Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset default behaviors
    mockPrepare.mockReturnValue(mockStatement);
    mockStatement.run.mockReturnValue({ lastInsertRowid: 1 });
    mockStatement.get.mockReturnValue(undefined);
    mockStatement.all.mockReturnValue([]);

    // Initialize DB
    await initDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('Initialization', () => {
    it('should initialize the database', () => {
      const db = getDatabase();
      expect(db).toBeDefined();
      expect(app.getPath).toHaveBeenCalledWith('userData');
      expect(mockPragma).toHaveBeenCalledWith('foreign_keys = ON');
    });

    it('should create tables', () => {
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS projects'));
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS settings'));
    });
  });

  describe('Project Operations', () => {
    it('should create a project', () => {
      mockStatement.run.mockReturnValue({ lastInsertRowid: 123 });

      const result = createProject('en', 'gen', 'ulb');

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO projects'));
      expect(mockStatement.run).toHaveBeenCalledWith('en', 'gen', 'ulb');
      expect(result.id).toBe(123);
      expect(result.name).toBe('en_gen_text_ulb');
    });

    it('should get all projects', () => {
      const mockRows = [
        { id: 1, language: 'en', book: 'gen', resource: 'ulb' },
        { id: 2, language: 'fr', book: 'exo', resource: 'tn' }
      ];
      mockStatement.all.mockReturnValue(mockRows);

      const projects = getAllProjects();

      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBe('en_gen_text_ulb');
    });

    it('should get project by ID', () => {
      const mockRow = { id: 10, language: 'es', book: 'mat', resource: 'obs' };
      mockStatement.get.mockReturnValue(mockRow);

      const project = getProject(10);

      expect(mockStatement.get).toHaveBeenCalledWith(10);
      expect(project.name).toBe('es_mat_text_obs');
    });

    it('should return undefined if project not found', () => {
      mockStatement.get.mockReturnValue(undefined);
      expect(getProject(999)).toBeUndefined();
    });

    it('should delete a project', () => {
      deleteProject(5);
      expect(mockStatement.run).toHaveBeenCalledWith(5);
    });

    it('should get project by language, book, and type', () => {
      const mockRow = { id: 20, language: 'en', book: 'psa', resource: 'tn' };
      mockStatement.get.mockReturnValue(mockRow);

      const project = getProjectByLanguageBookType('en', 'psa', 'tn');

      // Verify the query parameters were passed correctly
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('WHERE language = ? AND book = ? AND resource = ?'));
      expect(mockStatement.get).toHaveBeenCalledWith('en', 'psa', 'tn');

      // Verify returned object structure
      expect(project).toEqual({
        id: 20,
        language: 'en',
        book: 'psa',
        resource: 'tn',
        type: 'tn',
        name: 'en_psa_text_tn'
      });
    });
  });

  describe('Settings Operations', () => {
    it('should get a setting', () => {
      mockStatement.get.mockReturnValue({ value: 'dark' });
      const val = getSetting('theme');
      expect(val).toBe('dark');
    });

    it('should return null if setting missing', () => {
      mockStatement.get.mockReturnValue(undefined);
      expect(getSetting('missing')).toBeNull();
    });

    it('should set a setting', () => {
      setSetting('font', '12px');
      expect(mockStatement.run).toHaveBeenCalledWith('font', '12px');
    });

    it('should get all settings', () => {
      mockStatement.all.mockReturnValue([
        { key: 'theme', value: 'light' },
        { key: 'lang', value: 'en' }
      ]);

      const settings = getAllSettings();
      expect(settings).toEqual({
        theme: 'light',
        lang: 'en'
      });
    });
  });
});
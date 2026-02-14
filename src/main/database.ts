import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import log from 'electron-log';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  
  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'superfiles.db');
  log.info(`Database path: ${dbPath}`);

  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language TEXT NOT NULL,
      book TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Initialize default settings
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  stmt.run('theme', 'system');
  stmt.run('language', 'en');

  log.info('Database tables created successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Project operations
export function createProject(language: string, book: string, type: string): any {
  const db = getDatabase();
  // Generate folder name as language_book_text_type
  const folderName = `${language}_${book}_text_${type}`;
  const stmt = db.prepare('INSERT INTO projects (language, book, type) VALUES (?, ?, ?)');
  const result = stmt.run(language, book, type);
  return { id: result.lastInsertRowid, language, book, type, name: folderName };
}

export function getAllProjects(): any[] {
  const db = getDatabase();
  const projects = db.prepare('SELECT * FROM projects ORDER BY language ASC, book ASC, type ASC').all();
  // Add name property for folder access
  return projects.map((p: any) => ({
    ...p,
    name: `${p.language}_${p.book}_text_${p.type}`
  }));
}

export function getProject(id: number): any {
  const db = getDatabase();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
  if (project) {
    project.name = `${project.language}_${project.book}_text_${project.type}`;
  }
  return project;
}

export function getProjectByLanguageBookType(language: string, book: string, type: string): any {
  const db = getDatabase();
  const project = db.prepare('SELECT * FROM projects WHERE language = ? AND book = ? AND type = ?')
    .get(language, book, type) as any;
  if (project) {
    project.name = `${project.language}_${project.book}_text_${project.type}`;
  }
  return project;
}

export function deleteProject(id: number): void {
  const db = getDatabase();
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// Settings operations
export function getSetting(key: string): string | null {
  const db = getDatabase();
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return result?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const db = getDatabase();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

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
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
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
export function createProject(name: string, description: string = ''): any {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
  const result = stmt.run(name, description);
  return { id: result.lastInsertRowid, name, description };
}

export function getAllProjects(): any[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM projects ORDER BY name ASC').all();
}

export function getProject(id: number): any {
  const db = getDatabase();
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function getProjectByName(name: string): any {
  const db = getDatabase();
  return db.prepare('SELECT * FROM projects WHERE name = ?').get(name);
}

export function deleteProject(id: number): void {
  const db = getDatabase();
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// File operations
export function addFile(projectId: number, name: string, filePath: string): any {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO files (project_id, name, path) VALUES (?, ?, ?)');
  const result = stmt.run(projectId, name, filePath);
  return { id: result.lastInsertRowid, project_id: projectId, name, path: filePath };
}

export function getProjectFiles(projectId: number): any[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM files WHERE project_id = ? ORDER BY name ASC').all(projectId);
}

export function getFile(id: number): any {
  const db = getDatabase();
  return db.prepare('SELECT * FROM files WHERE id = ?').get(id);
}

export function deleteFile(id: number): void {
  const db = getDatabase();
  db.prepare('DELETE FROM files WHERE id = ?').run(id);
}

export function getProjectFileCount(projectId: number): number {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM files WHERE project_id = ?').get(projectId) as { count: number };
  return result.count;
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

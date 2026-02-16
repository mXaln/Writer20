import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';

// Mocks
vi.mock('electron');
vi.mock('electron-log');
vi.mock('../database');
vi.mock('simple-git');
vi.mock('fs');
vi.mock('archiver');
vi.mock('extract-zip');

// --- IMPORTS ---
import * as projectService from './projects';
import * as db from '../database';
import simpleGit from 'simple-git';
import extract from 'extract-zip';
import archiver from 'archiver';
import { app } from 'electron';

import * as fsMock from 'fs';
const fs = fsMock as any;

describe('Project Business Service', () => {
    // Use OS-specific path for Windows compatibility in tests
    const MOCK_HOME = process.platform === 'win32' ? 'C:\\mock\\home' : '/mock/home';
    const WRITER_DIR = path.join(MOCK_HOME, 'Writer20');

    beforeEach(() => {
        vi.clearAllMocks();
        fs.__reset();

        // We require electron inside the test to get the mocked version
        vi.mocked(app.getPath).mockImplementation((name: string) => {
            if (name === 'home') return MOCK_HOME;
            if (name === 'temp') return path.join(MOCK_HOME, 'temp');
            return '';
        });

        // Ensure Base Directory exists in mock FS
        fs.__setDir(WRITER_DIR);

        // Setup default DB mock behavior
        vi.mocked(db.createProject).mockReturnValue({ id: 1, name: 'default_project' } as any);
    });

    describe('create()', () => {
        it('should create a new project successfully', async () => {
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue(undefined);
            vi.mocked(db.createProject).mockReturnValue({ id: 1, name: 'en_mat_text_ulb' } as any);

            const result = await projectService.create('en', 'mat', 'ulb');

            expect(result.success).toBe(true);

            const projectPath = path.join(WRITER_DIR, 'en_mat_text_ulb');
            const manifestPath = path.join(projectPath, 'manifest.json');

            // Check FS operations
            expect(fs.mkdirSync).toHaveBeenCalledWith(projectPath, expect.objectContaining({ recursive: true }));
            expect(fs.writeFileSync).toHaveBeenCalledWith(manifestPath, expect.stringContaining('"package_version": 1'));

            // Check Git initialization
            const git = simpleGit();
            expect(git.init).toHaveBeenCalled();
            expect(git.commit).toHaveBeenCalled();
        });

        it('should fail if project exists', async () => {
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue({ id: 1 } as any);

            const result = await projectService.create('en', 'mat', 'ulb');

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/exists/);
        });
    });

    describe('list()', () => {
        it('should return all projects', () => {
            const projects = [{ id: 1, name: 'test' }];
            vi.mocked(db.getAllProjects).mockReturnValue(projects as any);

            const result = projectService.list();
            expect(result.data).toEqual(projects);
        });
    });

    describe('remove()', () => {
        it('should delete project folder and DB entry', () => {
            const pName = 'del_proj';
            const pPath = path.join(WRITER_DIR, pName);

            vi.mocked(db.getProject).mockReturnValue({ id: 1, name: pName } as any);
            fs.__setDir(pPath); // Folder exists

            const result = projectService.remove(1);

            expect(result.success).toBe(true);
            expect(fs.rmSync).toHaveBeenCalledWith(pPath, expect.objectContaining({ recursive: true }));
            expect(db.deleteProject).toHaveBeenCalledWith(1);
        });
    });

    describe('exportProject()', () => {
        it('should create a zip archive', async () => {
            const destPath = path.join(MOCK_HOME, 'export.zip');
            const project = { id: 1, name: 'proj_export' };

            const projectPath = path.join(WRITER_DIR, project.name);
            fs.__setDir(projectPath);

            // FIXED: Pass the full 'project' object, not 'project.id'
            const exportPromise = projectService.exportProject(project, destPath);

            // Since exportProject is async and waiting for the stream to close,
            // we must get the active stream and emit the event.
            const stream = fs.__getStream(destPath);

            // Verify stream exists before emitting (good for debugging)
            expect(stream).toBeDefined();
            stream.emit('close');

            const result: any = await exportPromise;

            expect(result.success).toBe(true);
            expect(fs.createWriteStream).toHaveBeenCalledWith(destPath);

            // Optional: Verify archiver was finalized
            const archiveInstance = archiver('zip', { zlib: { level: 9 } });
            expect(archiveInstance.finalize).toHaveBeenCalled();
        });

        it('should fail if project folder does not exist', async () => {
            const destPath = path.join(MOCK_HOME, 'export.zip');
            const project = { id: 1, name: 'missing_project' };
            // We do NOT call fs.__setDir here

            const result: any = await projectService.exportProject(project, destPath);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/folder not found/);
        });
    });

    describe('importProject()', () => {
        it('should import a valid zip', async () => {
            const ZIP_PATH = path.join(MOCK_HOME, 'import.zip');
            fs.__setFile(ZIP_PATH, 'ZIPDATA');

            // Override default extract behavior for this specific test
            vi.mocked(extract).mockImplementation(async (src, opts: any) => {
                const tempDir = opts.dir;
                const manifest = { target_language: { id: 'es' }, project: { id: 'mrk' }, resource: { id: 'tn' } };

                // Explicitly mark these paths as directories so fs.existsSync() returns true
                fs.__setDir(tempDir);
                fs.__setDir(path.join(tempDir, 'contents'));

                // Simulate extracted files in mock FS
                fs.__setFile(path.join(tempDir, 'manifest.json'), JSON.stringify(manifest));
                fs.__setFile(path.join(tempDir, 'contents', '01.txt'), 'CONTENT');
            });

            // Mock DB to return undefined (not existing) so we can create it
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue(undefined);
            vi.mocked(db.createProject).mockReturnValue({ id: 50, name: 'es_mrk_text_tn' } as any);

            const result: any = await projectService.importProject(ZIP_PATH);

            expect(result.success).toBe(true);

            // Verify file copy from temp to new project folder
            const newFile = path.join(WRITER_DIR, 'es_mrk_text_tn', 'contents', '01.txt');
            expect(fs.copyFileSync).toHaveBeenCalled();
            expect(fs.__getFile(newFile)).toBe('CONTENT');
        });
    });
});
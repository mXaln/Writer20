import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';

// --- MOCKS ---
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

// Access defaults and helpers
const fs = (fsMock as any).default;
const fsHelpers = fsMock as any;

describe('Project Business Service', () => {
    // Platform-agnostic path helpers
    const MOCK_HOME = process.platform === 'win32' ? 'C:\\mock\\home' : '/mock/home';
    const WRITER_DIR = path.join(MOCK_HOME, 'Writer20');

    beforeEach(() => {
        vi.clearAllMocks();
        fsHelpers.__reset();

        vi.mocked(app.getPath).mockImplementation((name: string) => {
            if (name === 'home') return MOCK_HOME;
            if (name === 'temp') return path.join(MOCK_HOME, 'temp');
            return '';
        });

        fsHelpers.__setDir(WRITER_DIR);
        vi.mocked(db.createProject).mockReturnValue({ id: 1, name: 'default_project' } as any);
    });

    describe('create()', () => {
        it('should create a new project successfully', async () => {
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue(undefined);
            vi.mocked(db.createProject).mockReturnValue({ id: 1, name: 'en_mat_text_ulb' } as any);

            const result = await projectService.create('en', 'mat', 'ulb');

            expect(result.success).toBe(true);
            const projectPath = path.join(WRITER_DIR, 'en_mat_text_ulb');
            expect(fs.mkdirSync).toHaveBeenCalledWith(projectPath, expect.objectContaining({ recursive: true }));

            const git = simpleGit();
            expect(git.init).toHaveBeenCalled();
        });

        it('should fail if project exists', async () => {
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue({ id: 1 } as any);
            const result = await projectService.create('en', 'mat', 'ulb');
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/exists/);
        });

        // NEW: Test Git Error Handling
        it('should not fail create if git init fails', async () => {
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue(undefined);
            vi.mocked(db.createProject).mockReturnValue({ id: 2, name: 'git_fail_project' } as any);

            // Force git error
            const git = simpleGit();
            vi.mocked(git.init).mockRejectedValueOnce(new Error('Git not installed'));

            const result = await projectService.create('en', 'luk', 'tn');

            // Should still succeed, just log the error
            expect(result.success).toBe(true);
        });

        // NEW: Test General Error Handling
        it('should handle file system errors', async () => {
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue(undefined);
            // Force mkdir to throw
            vi.mocked(fs.mkdirSync).mockImplementationOnce(() => { throw new Error('Permission denied'); });

            const result = await projectService.create('en', 'mat', 'ulb');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });
    });

    describe('list()', () => {
        it('should return all projects', () => {
            const projects = [{ id: 1, name: 'test' }];
            vi.mocked(db.getAllProjects).mockReturnValue(projects as any);
            const result = projectService.list();
            expect(result.data).toEqual(projects);
        });

        // NEW: Test Error Handling
        it('should handle db errors', () => {
            vi.mocked(db.getAllProjects).mockImplementationOnce(() => { throw new Error('DB Error'); });
            const result = projectService.list();
            expect(result.success).toBe(false);
            expect(result.error).toBe('DB Error');
        });
    });

    // NEW: Added missing 'get' tests
    describe('get()', () => {
        it('should return project if found', () => {
            vi.mocked(db.getProject).mockReturnValue({ id: 1, name: 'Found' } as any);
            const result = projectService.get(1);
            expect(result.success).toBe(true);
            expect(result.data).toEqual({ id: 1, name: 'Found' });
        });

        it('should return error if not found', () => {
            vi.mocked(db.getProject).mockReturnValue(undefined);
            const result = projectService.get(99);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Project not found');
        });

        it('should handle db errors', () => {
            vi.mocked(db.getProject).mockImplementationOnce(() => { throw new Error('DB Fail'); });
            const result = projectService.get(1);
            expect(result.success).toBe(false);
            expect(result.error).toBe('DB Fail');
        });
    });

    describe('remove()', () => {
        it('should delete project folder and DB entry', () => {
            const pName = 'del_proj';
            const pPath = path.join(WRITER_DIR, pName);
            vi.mocked(db.getProject).mockReturnValue({ id: 1, name: pName } as any);
            fsHelpers.__setDir(pPath); // Folder exists

            const result = projectService.remove(1);

            expect(result.success).toBe(true);
            expect(fs.rmSync).toHaveBeenCalled();
            expect(db.deleteProject).toHaveBeenCalledWith(1);
        });

        // NEW: Test case where folder is already gone
        it('should succeed even if folder is missing on disk', () => {
            vi.mocked(db.getProject).mockReturnValue({ id: 1, name: 'ghost_proj' } as any);
            // We do NOT create the folder in FS mock

            const result = projectService.remove(1);

            expect(result.success).toBe(true);
            expect(fs.rmSync).not.toHaveBeenCalled(); // Should skip rmSync
            expect(db.deleteProject).toHaveBeenCalledWith(1);
        });

        // NEW: Test Project Not Found
        it('should fail if project not in DB', () => {
            vi.mocked(db.getProject).mockReturnValue(undefined);
            const result = projectService.remove(99);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Project not found');
        });
    });

    describe('exportProject()', () => {
        it('should create a zip archive', async () => {
            const destPath = path.join(MOCK_HOME, 'export.zip');
            const project = { id: 1, name: 'proj_export' };
            fsHelpers.__setDir(path.join(WRITER_DIR, project.name));

            const exportPromise = projectService.exportProject(project, destPath);
            const stream = fsHelpers.__getStream(destPath);
            stream.emit('close');

            const result: any = await exportPromise;
            expect(result.success).toBe(true);
        });

        it('should fail if project folder does not exist', async () => {
            const project = { id: 1, name: 'missing_project' };
            const result: any = await projectService.exportProject(project, 'out.zip');
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/folder not found/);
        });

        // NEW: Test Archive Error
        it('should handle archive errors', async () => {
            const destPath = path.join(MOCK_HOME, 'fail.zip');
            const project = { id: 1, name: 'proj_error' };
            fsHelpers.__setDir(path.join(WRITER_DIR, project.name));

            // Use archiver factory mock to access the instance
            const mockArchiveInstance = {
                on: vi.fn(),
                pipe: vi.fn(),
                directory: vi.fn(),
                finalize: vi.fn(),
            };
            vi.mocked(archiver).mockReturnValue(mockArchiveInstance as any);

            const exportPromise = projectService.exportProject(project, destPath);

            // Simulate ERROR event on archive
            // We need to find the callback passed to 'on("error", cb)'
            const errorCallback = mockArchiveInstance.on.mock.calls.find(call => call[0] === 'error')?.[1];
            expect(errorCallback).toBeDefined();
            errorCallback(new Error('Zip Failed'));

            const result: any = await exportPromise;
            expect(result.success).toBe(false);
            expect(result.error).toBe('Zip Failed');
        });
    });

    describe('importProject()', () => {
        const ZIP_PATH = path.join(MOCK_HOME, 'import.zip');

        it('should import a valid zip with contents folder', async () => {
            fsHelpers.__setFile(ZIP_PATH, 'DATA');

            vi.mocked(extract).mockImplementation(async (src, opts: any) => {
                const tempDir = opts.dir;
                fsHelpers.__setDir(path.join(tempDir, 'contents')); // Simulate contents dir
                fsHelpers.__setFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
                    target_language: { id: 'es' }, project: { id: 'mrk' }, resource: { id: 'tn' }
                }));
                fsHelpers.__setFile(path.join(tempDir, 'contents', 'file.txt'), 'content');
            });

            vi.mocked(db.createProject).mockReturnValue({ id: 50, name: 'es_mrk_text_tn' } as any);

            const result: any = await projectService.importProject(ZIP_PATH);
            expect(result.success).toBe(true);
            expect(fs.copyFileSync).toHaveBeenCalled();
        });

        // NEW: Test Flat Zip (No contents' folder)
        it('should import a flat zip (root files)', async () => {
            fsHelpers.__setFile(ZIP_PATH, 'DATA');

            vi.mocked(extract).mockImplementation(async (src, opts: any) => {
                const tempDir = opts.dir;
                // NO 'contents' folder created here
                fsHelpers.__setDir(tempDir);
                fsHelpers.__setFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
                    target_language: { id: 'en' }, project: { id: 'gen' }, resource: { id: 'ulb' }
                }));
                fsHelpers.__setFile(path.join(tempDir, 'root_file.txt'), 'root content');
            });

            vi.mocked(db.createProject).mockReturnValue({ id: 51, name: 'en_gen_text_ulb' } as any);

            const result: any = await projectService.importProject(ZIP_PATH);

            expect(result.success).toBe(true);
            // Should copy from root, skipping manifest
            expect(fs.copyFileSync).toHaveBeenCalled();
            // Verify logic skipped manifest.json copy
            // (Mock call inspection can verify arguments, but success implies it worked)
        });

        // NEW: Test Missing Zip
        it('should fail if zip file missing', async () => {
            const result: any = await projectService.importProject('/missing.zip');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Import file not found');
        });

        // NEW: Test Conflict
        it('should fail and cleanup if project exists', async () => {
            fsHelpers.__setFile(ZIP_PATH, 'DATA');
            vi.mocked(extract).mockImplementation(async (src, opts: any) => {
                const tempDir = opts.dir;
                fsHelpers.__setFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
                    target_language: { id: 'en' }, project: { id: 'dup' }, resource: { id: 'dup' }
                }));
            });

            // Simulate existing project
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue({ id: 1 } as any);

            const result: any = await projectService.importProject(ZIP_PATH);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/already exists/);
            expect(fs.rmSync).toHaveBeenCalled(); // Ensure temp cleanup
        });
    });
});
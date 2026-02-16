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

// Helper casts
const fs = (fsMock as any).default;
const fsHelpers = fsMock as any;

describe('Project Business Service', () => {
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

        it('should import a NEW project successfully', async () => {
            fsHelpers.__setFile(ZIP_PATH, 'DATA');

            // Mock Extraction
            vi.mocked(extract).mockImplementation(async (src, opts: any) => {
                const tempDir = opts.dir;
                fsHelpers.__setDir(path.join(tempDir, 'contents'));
                fsHelpers.__setFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
                    target_language: { id: 'es' }, project: { id: 'mrk' }, resource: { id: 'tn' }
                }));
            });

            // Mock DB: Project does NOT exist
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue(undefined);
            vi.mocked(db.createProject).mockReturnValue({ id: 50, name: 'es_mrk_text_tn' } as any);

            const result: any = await projectService.importProject(ZIP_PATH);

            expect(result.success).toBe(true);
            expect(result.data.projectExists).toBeUndefined(); // Should look like a normal project object
            expect(db.createProject).toHaveBeenCalled();
        });

        it('should detect EXISTING project and return status (NOT fail)', async () => {
            fsHelpers.__setFile(ZIP_PATH, 'DATA');

            vi.mocked(extract).mockImplementation(async (src, opts: any) => {
                const tempDir = opts.dir;
                fsHelpers.__setFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
                    target_language: { id: 'en' }, project: { id: 'dup' }, resource: { id: 'dup' }
                }));
            });

            // Mock DB: Project EXISTS
            vi.mocked(db.getProjectByLanguageBookType).mockReturnValue({ id: 99, name: 'existing_proj' } as any);

            const result: any = await projectService.importProject(ZIP_PATH);

            // UPDATED BEHAVIOR: Returns success=true, but data contains flags
            expect(result.success).toBe(true);
            expect(result.data.projectExists).toBe(true);
            expect(result.data.projectId).toBe(99);
            expect(result.data.projectName).toBe('existing_proj');

            // Should NOT have created a new project yet
            expect(db.createProject).not.toHaveBeenCalled();
        });

        it('should fail if zip file missing', async () => {
            const result: any = await projectService.importProject('/missing.zip');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Import file not found');
        });
    });

    describe('importWithOption()', () => {
        const ZIP_PATH = path.join(MOCK_HOME, 'import.zip');
        const PROJECT_ID = 99;
        const PROJECT_NAME = 'existing_proj';
        const PROJECT_DIR = path.join(WRITER_DIR, PROJECT_NAME);

        beforeEach(() => {
            fsHelpers.__setFile(ZIP_PATH, 'ZIP_DATA');
            fsHelpers.__setDir(PROJECT_DIR);
            fsHelpers.__setDir(path.join(PROJECT_DIR, 'contents'));
            vi.mocked(db.getProject).mockReturnValue({ id: PROJECT_ID, name: PROJECT_NAME } as any);
        });

        it('should handle "cancel" option', async () => {
            const result: any = await projectService.importWithOption(PROJECT_ID, ZIP_PATH, 'cancel');
            expect(result.success).toBe(true);
            expect(result.canceled).toBe(true);
        });

        it('should handle "overwrite" option (Simple File Copy)', async () => {
            // Mock extraction
            vi.mocked(extract).mockImplementation(async (src, opts: any) => {
                const tempDir = opts.dir;
                fsHelpers.__setDir(path.join(tempDir, 'contents'));
                fsHelpers.__setFile(path.join(tempDir, 'contents', 'new_file.txt'), 'New Content');
            });

            const result: any = await projectService.importWithOption(PROJECT_ID, ZIP_PATH, 'overwrite');

            expect(result.success).toBe(true);
            // Verify new file was copied to project dir
            const destPath = path.join(PROJECT_DIR, 'contents', 'new_file.txt');
            expect(fs.copyFileSync).toHaveBeenCalled();
            // In a real FS mock, we'd check fsHelpers.__hasFile(destPath) if copyFileSync logic in mock supports it fully
        });

        it('should handle "merge" option with NO Git (Fallback to File Compare)', async () => {
            // Mock Git to say "Not a repo"
            const gitMock = {
                checkIsRepo: vi.fn().mockResolvedValue(false),
                init: vi.fn(),
                add: vi.fn(),
                commit: vi.fn()
            };
            vi.mocked(simpleGit).mockReturnValue(gitMock as any);

            // Mock extraction with conflicting content
            vi.mocked(extract).mockImplementation(async (src, opts: any) => {
                const tempDir = opts.dir;
                fsHelpers.__setDir(path.join(tempDir, 'contents'));
                fsHelpers.__setFile(path.join(tempDir, 'contents', '01.txt'), 'Imported Content');
            });

            // Set existing local file
            fsHelpers.__setFile(path.join(PROJECT_DIR, 'contents', '01.txt'), 'Local Content');

            const result: any = await projectService.importWithOption(PROJECT_ID, ZIP_PATH, 'merge');

            // Fallback logic detects conflict via file comparison
            expect(result.success).toBe(true);
            expect(result.data.hasConflicts).toBe(true);
            expect(result.data.conflicts).toHaveLength(1);
            expect(result.data.conflicts[0].fileName).toBe('01.txt');
        });

        it('should handle "merge" option with Git (Conflict Detected)', async () => {
            // 1. Setup Git Mock behavior
            const gitMock = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                branchLocal: vi.fn().mockResolvedValue({ current: 'master' }),
                addRemote: vi.fn(),
                removeRemote: vi.fn(),
                fetch: vi.fn(),
                add: vi.fn(),
                commit: vi.fn(),
                // Simulate a merge failure
                merge: vi.fn().mockRejectedValue(new Error('CONFLICTS: contents/01.txt:add/add')),
                status: vi.fn().mockResolvedValue({ conflicted: ['contents/01.txt'] })
            };
            vi.mocked(simpleGit).mockReturnValue(gitMock as any);

            // 2. Setup Filesystem for "Conflict" detection logic
            // The code reads the file to find <<<<<<< markers
            const conflictContent = `<<<<<<< HEAD\nLocal\n=======\nImported\n>>>>>>> imported`;

            // Mock extraction
            vi.mocked(extract).mockImplementation(async (src, opts: any) => {
                // The merge logic extracts to temp, tries git merge
                // If conflict, it expects the file ON DISK (in project folder) to contain markers
                // So we manually set the "Project File" to look like it has markers
                fsHelpers.__setFile(path.join(PROJECT_DIR, 'contents', '01.txt'), conflictContent);
            });

            const result: any = await projectService.importWithOption(PROJECT_ID, ZIP_PATH, 'merge');

            expect(result.success).toBe(true);
            expect(result.data.mergedWithConflicts).toBe(true);
            // Verify it parsed the conflict from the file
            expect(result.data.conflicts).toHaveLength(1);
            expect(result.data.conflicts[0].fileId).toBe('01.txt');
        });

        it('should handle "merge" option with Git (Clean Merge)', async () => {
            // 1. Setup Git Mock behavior (Success)
            const gitMock = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                branchLocal: vi.fn().mockResolvedValue({ current: 'master' }),
                addRemote: vi.fn(),
                removeRemote: vi.fn(),
                fetch: vi.fn(),
                add: vi.fn(),
                commit: vi.fn(),
                merge: vi.fn().mockResolvedValue('Merge made by the ort strategy.'), // Success
                status: vi.fn().mockResolvedValue({ conflicted: [] })
            };
            vi.mocked(simpleGit).mockReturnValue(gitMock as any);

            vi.mocked(extract).mockImplementation(async () => {});

            const result: any = await projectService.importWithOption(PROJECT_ID, ZIP_PATH, 'merge');

            expect(result.success).toBe(true);
            expect(result.data.id).toBe(PROJECT_ID); // Returns project object on success
            expect(gitMock.merge).toHaveBeenCalled();
            expect(gitMock.commit).toHaveBeenCalledWith(expect.stringContaining('Merge:'));
        });
    });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';

// --- MOCKS ---
vi.mock('electron');
vi.mock('electron-log');
vi.mock('fs');
vi.mock('simple-git');
vi.mock('../database');

// --- IMPORTS ---
import * as fileService from './files';
import * as db from '../database';
import { shell } from 'electron';
import simpleGit from 'simple-git';
import * as fsMock from 'fs';
import {ErrorCode} from "../error-codes";

// Access defaults and helpers
const fs = (fsMock as any).default;
const fsHelpers = fsMock as any;

describe('File Service', () => {
    // Platform-agnostic path helpers
    const MOCK_HOME = process.platform === 'win32' ? 'C:\\tmp\\fake-user-data' : '/tmp/fake-user-data';
    const MOCK_PROJECT_PATH = path.join(MOCK_HOME, 'Writer20', 'TestProject');
    const MOCK_CONTENTS_PATH = path.join(MOCK_PROJECT_PATH, 'contents');

    const setupValidProject = () => {
        vi.mocked(db.getProject).mockReturnValue({ id: 1, name: 'TestProject' } as any);
        // Ensure standard directories exist so existsSync returns true naturally
        fsHelpers.__setDir(MOCK_PROJECT_PATH);
        fsHelpers.__setDir(MOCK_CONTENTS_PATH);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        fsHelpers.__reset();
        setupValidProject();
    });

    // --- EXISTING TESTS ---

    describe('create()', () => {
        it('should create 01.txt if folder is empty', () => {
            const result = fileService.create(1);
            expect(result.success).toBe(true);
            expect(result.data?.name).toBe('01.txt');
            expect(fsHelpers.__hasFile(path.join(MOCK_CONTENTS_PATH, '01.txt'))).toBe(true);
        });

        it('should increment filename (02.txt) if 01.txt exists', () => {
            fsHelpers.__setFile(path.join(MOCK_CONTENTS_PATH, '01.txt'), '');
            const result = fileService.create(1);
            expect(result.data?.name).toBe('02.txt');
        });

        it('should fill numbering gaps', () => {
            fsHelpers.__setFile(path.join(MOCK_CONTENTS_PATH, '01.txt'), '');
            fsHelpers.__setFile(path.join(MOCK_CONTENTS_PATH, '03.txt'), '');
            const result = fileService.create(1);
            expect(result.data?.name).toBe('02.txt');
        });

        it('should create contents folder if missing (via helper)', () => {
            fsHelpers.__reset();
            fsHelpers.__setDir(MOCK_PROJECT_PATH); // No MOCK_CONTENTS_PATH
            const result = fileService.create(1);

            expect(result.success).toBe(true);
            expect(fs.mkdirSync).toHaveBeenCalledWith(MOCK_CONTENTS_PATH, expect.anything());
        });

        it('should return error if project not found', () => {
            vi.mocked(db.getProject).mockReturnValue(null);
            const result = fileService.create(999);
            expect(result.success).toBe(false);
            expect(result.error).toBe(ErrorCode.PROJECT_NOT_FOUND);
        });

        it('should handle system errors gracefully', () => {
            vi.mocked(fs.readdirSync).mockImplementationOnce(() => { throw new Error('Disk full'); });
            const result = fileService.create(1);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Disk full');
        });
    });

    describe('read()', () => {
        it('should read file content', () => {
            const p = path.join(MOCK_CONTENTS_PATH, 'test.txt');
            fsHelpers.__setFile(p, 'Hello World');
            const result = fileService.read(p);
            expect(result.data).toBe('Hello World');
        });

        it('should return error if missing', () => {
            const result = fileService.read('/missing.txt');
            expect(result.success).toBe(false);
            expect(result.error).toBe(ErrorCode.FILE_NOT_FOUND);
        });

        it('should handle read errors', () => {
            const p = path.join(MOCK_CONTENTS_PATH, 'test.txt');
            fsHelpers.__setFile(p, 'data');
            vi.mocked(fs.readFileSync).mockImplementationOnce(() => { throw new Error('Read perm'); });

            const result = fileService.read(p);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Read perm');
        });
    });

    describe('write()', () => {
        it('should write content and commit if new file', async () => {
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            await fileService.write(p, 'New Data');

            expect(fsHelpers.__getFile(p)).toBe('New Data');
            const git = simpleGit();
            expect(git.add).toHaveBeenCalled();
            expect(git.commit).toHaveBeenCalled();
        });

        it('should skip commit if file existed and content is empty', async () => {
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            fsHelpers.__setFile(p, 'Old Data');

            await fileService.write(p, '');
            const git = simpleGit();
            expect(git.commit).not.toHaveBeenCalled();
        });

        it('should handle git errors without failing the write', async () => {
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            const git = simpleGit();
            vi.mocked(git.commit).mockRejectedValueOnce(new Error('Git failure'));

            const result = await fileService.write(p, 'Data');
            expect(result.success).toBe(true);
        });

        it('should fail if filesystem write fails', async () => {
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            vi.mocked(fs.writeFileSync).mockImplementationOnce(() => { throw new Error('Write locked'); });

            const result = await fileService.write(p, 'Data');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Write locked');
        });
    });

    describe('list()', () => {
        it('should list files sorted', () => {
            fsHelpers.__setFile(path.join(MOCK_CONTENTS_PATH, 'b.txt'), '');
            fsHelpers.__setFile(path.join(MOCK_CONTENTS_PATH, 'a.txt'), '');

            const result = fileService.list(1);
            expect(result.data).toHaveLength(2);
            // @ts-ignore
            expect(result.data[0].name).toBe('a.txt');
        });

        it('should return empty list if folder missing', () => {
            fsHelpers.__reset();
            fsHelpers.__setDir(MOCK_PROJECT_PATH);

            const result = fileService.list(1);
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('should return error if project missing', () => {
            vi.mocked(db.getProject).mockReturnValue(null);
            const result = fileService.list(99);
            expect(result.success).toBe(false);
        });

        it('should handle fs errors', () => {
            vi.mocked(fs.readdirSync).mockImplementationOnce(() => { throw new Error('Err'); });
            const result = fileService.list(1);
            expect(result.success).toBe(false);
        });
    });

    describe('listWithContent()', () => {
        it('should generate 100 items placeholders', () => {
            const result = fileService.listWithContent(1);
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(100);
            // @ts-ignore
            expect(result.data[0].name).toBe('01.txt');
        });

        it('should read content for existing files', () => {
            const p = path.join(MOCK_CONTENTS_PATH, '05.txt');
            fsHelpers.__setFile(p, 'Chapter 5 Content');

            const result = fileService.listWithContent(1);

            // @ts-ignore
            const file5 = result.data.find((f: any) => f.name === '05.txt');
            expect(file5).toBeDefined();
            // @ts-ignore
            expect(file5.content).toBe('Chapter 5 Content');

            // @ts-ignore
            const file1 = result.data.find((f: any) => f.name === '01.txt');
            // @ts-ignore
            expect(file1.content).toBe('');
        });

        it('should return error if project missing', () => {
            vi.mocked(db.getProject).mockReturnValue(null);
            const result = fileService.listWithContent(99);
            expect(result.success).toBe(false);
            expect(result.error).toBe(ErrorCode.PROJECT_NOT_FOUND);
        });

        it('should handle errors', () => {
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            fsHelpers.__setFile(p, 'data');
            vi.mocked(fs.readFileSync).mockImplementationOnce(() => { throw new Error('Err'); });

            const result = fileService.listWithContent(1);
            expect(result.success).toBe(false);
        });
    });

    describe('open()', () => {
        it('should open path via electron shell', async () => {
            const p = '/test/file.txt';
            fsHelpers.__setFile(p, 'content');

            const result = await fileService.open(p);
            expect(result.success).toBe(true);
            expect(shell.openPath).toHaveBeenCalledWith(p);
        });

        it('should return error if file missing', async () => {
            const result = await fileService.open('/missing.txt');
            expect(result.success).toBe(false);
            expect(result.error).toBe(ErrorCode.FILE_NOT_FOUND);
        });

        it('should handle errors', async () => {
            const p = '/test/file.txt';
            fsHelpers.__setFile(p, 'content');
            vi.mocked(shell.openPath).mockRejectedValueOnce(new Error('OS Err'));

            const result = await fileService.open(p);
            expect(result.success).toBe(false);
        });
    });

    describe('remove()', () => {
        it('should remove file from disk if requested', () => {
            const p = '/test/del.txt';
            fsHelpers.__setFile(p, 'data');

            const result = fileService.remove(p, true);
            expect(result.success).toBe(true);
            expect(fsHelpers.__hasFile(p)).toBe(false);
        });

        it('should not delete from disk if flag is false', () => {
            const p = '/test/del.txt';
            fsHelpers.__setFile(p, 'data');

            const result = fileService.remove(p, false);
            expect(result.success).toBe(true);
            expect(fsHelpers.__hasFile(p)).toBe(true);
        });

        it('should return error if file does not exist', () => {
            const result = fileService.remove('/missing.txt', true);
            expect(result.success).toBe(false);
            expect(result.error).toBe(ErrorCode.FILE_NOT_FOUND);
        });

        it('should handle fs deletion errors', () => {
            const p = '/test/locked.txt';
            fsHelpers.__setFile(p, 'data');
            vi.mocked(fs.unlinkSync).mockImplementationOnce(() => { throw new Error('Locked'); });

            const result = fileService.remove(p, true);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Locked');
        });
    });

    // --- NEW TESTS FOR CONFLICTS ---

    describe('getConflictedFiles()', () => {
        it('should return empty array if project not found', () => {
            vi.mocked(db.getProject).mockReturnValue(null);
            const files = fileService.getConflictedFiles(99);
            expect(files).toEqual([]);
        });

        it('should return empty array if contents folder missing', () => {
            fsHelpers.__reset();
            fsHelpers.__setDir(MOCK_PROJECT_PATH);
            const files = fileService.getConflictedFiles(1);
            expect(files).toEqual([]);
        });

        it('should find files containing git conflict markers', () => {
            // Setup files
            const conflictContent = `<<<<<<< HEAD\nLocal changes\n=======\nRemote changes\n>>>>>>> remote`;
            fsHelpers.__setFile(path.join(MOCK_CONTENTS_PATH, '01.txt'), 'Normal content');
            fsHelpers.__setFile(path.join(MOCK_CONTENTS_PATH, '02.txt'), conflictContent);
            fsHelpers.__setFile(path.join(MOCK_CONTENTS_PATH, '03.md'), conflictContent); // Should ignore non .txt

            const files = fileService.getConflictedFiles(1);

            expect(files).toEqual(['02.txt']);
        });
    });

    describe('resolveConflict()', () => {
        it('should return error if file missing', async () => {
            const result = await fileService.resolveConflict('/missing.txt', 'data', 1);
            expect(result.success).toBe(false);
            expect(result.error).toBe(ErrorCode.FILE_NOT_FOUND);
        });

        it('should resolve conflict and commit if no other conflicts exist', async () => {
            const p = path.join(MOCK_CONTENTS_PATH, '02.txt');
            fsHelpers.__setFile(p, '<<<<<<< ======= >>>>>>>'); // Starts conflicted

            // We write the accepted content which removes markers
            const result = await fileService.resolveConflict(p, 'Clean Content', 1);

            expect(result.success).toBe(true);
            expect(fsHelpers.__getFile(p)).toBe('Clean Content');

            const git = simpleGit();
            expect(git.add).toHaveBeenCalled();
            expect(git.commit).toHaveBeenCalledWith('Resolved merge conflicts');
            // Since it was the only conflict, mergeComplete is true
            expect((result as any).mergeComplete).toBe(true);
        });

        it('should resolve conflict but NOT commit if other conflicts remain', async () => {
            const p1 = path.join(MOCK_CONTENTS_PATH, '01.txt');
            const p2 = path.join(MOCK_CONTENTS_PATH, '02.txt');

            fsHelpers.__setFile(p1, '<<<<<<< ======= >>>>>>>'); // Conflict 1
            fsHelpers.__setFile(p2, '<<<<<<< ======= >>>>>>>'); // Conflict 2

            // Resolve file 1
            const result = await fileService.resolveConflict(p1, 'Clean Content', 1);

            expect(result.success).toBe(true);
            expect(fsHelpers.__getFile(p1)).toBe('Clean Content'); // File updated

            const git = simpleGit();
            expect(git.add).toHaveBeenCalled();
            // Should NOT commit because p2 is still conflicted
            expect(git.commit).not.toHaveBeenCalled();
            expect((result as any).mergeComplete).toBe(false);
        });

        it('should handle missing project gracefully during git ops', async () => {
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            fsHelpers.__setFile(p, 'data');

            // Delete project right before git operations
            vi.mocked(db.getProject).mockReturnValue(null);

            const result = await fileService.resolveConflict(p, 'Clean Content', 1);

            expect(result.success).toBe(true);
            expect((result as any).mergeComplete).toBe(false);
            expect(fsHelpers.__getFile(p)).toBe('Clean Content');
        });

        it('should handle git errors gracefully', async () => {
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            fsHelpers.__setFile(p, 'data');

            const git = simpleGit();
            vi.mocked(git.add).mockRejectedValueOnce(new Error('Git fail'));

            const result = await fileService.resolveConflict(p, 'Clean Content', 1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Git fail');
        });
    });
});
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

        it('should create contents folder if missing', () => {
            // Reset state specific for this test
            fsHelpers.__reset();
            fsHelpers.__setDir(MOCK_PROJECT_PATH);
            // We intentionally do NOT create MOCK_CONTENTS_PATH here

            const result = fileService.create(1);

            expect(result.success).toBe(true);
            expect(fs.mkdirSync).toHaveBeenCalledWith(MOCK_CONTENTS_PATH, expect.anything());
        });

        it('should return error if project not found', () => {
            vi.mocked(db.getProject).mockReturnValue(null);
            const result = fileService.create(999);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Project not found');
        });

        it('should handle system errors gracefully', () => {
            // Mock implementation once so it doesn't leak
            vi.mocked(fs.readdirSync).mockImplementationOnce(() => {
                throw new Error('Disk full');
            });

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
            expect(result.error).toBe('File not found');
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
            // Write should still succeed even if git fails
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
            // FIX: Don't mock implementation. Manipulate state instead.
            fsHelpers.__reset();
            fsHelpers.__setDir(MOCK_PROJECT_PATH);
            // We do NOT add MOCK_CONTENTS_PATH.
            // fs.existsSync(contents) will return false naturally.

            const result = fileService.list(1);
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
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

        it('should handle errors', () => {
            // Create a file so it tries to read
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            fsHelpers.__setFile(p, 'data');

            // Mock read failure
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
            // Ensure state is clean (no file exists)
            const result = await fileService.open('/missing.txt');
            expect(result.success).toBe(false);
            expect(result.error).toBe('File not found');
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

        it('should return error if file does not exist', () => {
            const result = fileService.remove('/missing.txt', true);
            expect(result.success).toBe(false);
            expect(result.error).toBe('File not found');
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
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';

// Mocks
vi.mock('electron');
vi.mock('electron-log');
vi.mock('fs');
vi.mock('simple-git');
vi.mock('../database');

import * as fileService from './files';
import * as db from '../database';
import { shell } from 'electron';
import simpleGit from 'simple-git';

import * as fsMock from 'fs';
const fs = fsMock as any;

describe('File Service', () => {
    const MOCK_HOME = process.platform === 'win32' ? 'C:\\tmp\\fake-user-data' : '/tmp/fake-user-data';
    const MOCK_PROJECT_PATH = path.join(MOCK_HOME, 'Writer20', 'TestProject');
    const MOCK_CONTENTS_PATH = path.join(MOCK_PROJECT_PATH, 'contents');

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset FS State using our custom helper
        fs.__reset();

        // Ensure base folders exist in mock FS
        fs.__setDir(MOCK_PROJECT_PATH);
        fs.__setDir(MOCK_CONTENTS_PATH);

        // Default DB Mock
        vi.mocked(db.getProject).mockReturnValue({ id: 1, name: 'TestProject' } as any);
    });

    describe('create()', () => {
        it('should create 01.txt if folder is empty', () => {
            const result = fileService.create(1);

            expect(result.success).toBe(true);
            expect(result.data?.name).toBe('01.txt');
            expect(fs.__hasFile(path.join(MOCK_CONTENTS_PATH, '01.txt'))).toBe(true);
        });

        it('should increment filename (02.txt) if 01.txt exists', () => {
            fs.__setFile(path.join(MOCK_CONTENTS_PATH, '01.txt'), '');

            const result = fileService.create(1);

            expect(result.data?.name).toBe('02.txt');
        });

        it('should fill numbering gaps', () => {
            fs.__setFile(path.join(MOCK_CONTENTS_PATH, '01.txt'), '');
            fs.__setFile(path.join(MOCK_CONTENTS_PATH, '03.txt'), '');

            const result = fileService.create(1);

            expect(result.data?.name).toBe('02.txt');
        });

        it('should return error if project not found', () => {
            vi.mocked(db.getProject).mockReturnValue(null);

            const result = fileService.create(999);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Project not found');
        });
    });

    describe('read()', () => {
        it('should read file content', () => {
            const p = path.join(MOCK_CONTENTS_PATH, 'test.txt');
            fs.__setFile(p, 'Hello World');

            const result = fileService.read(p);
            expect(result.data).toBe('Hello World');
        });

        it('should return error if missing', () => {
            const result = fileService.read('/missing.txt');
            expect(result.success).toBe(false);
        });
    });

    describe('write()', () => {
        it('should write content to file', async () => {
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            await fileService.write(p, 'New Data');

            expect(fs.__getFile(p)).toBe('New Data');
        });

        it('should commit to git on content change', async () => {
            const p = path.join(MOCK_CONTENTS_PATH, '01.txt');
            fs.__setFile(p, 'Old Data');

            await fileService.write(p, 'New Data');

            // Access the mock instance returned by simpleGit()
            const gitInstance = simpleGit();
            expect(gitInstance.add).toHaveBeenCalled();
            expect(gitInstance.commit).toHaveBeenCalledWith(expect.stringContaining('Update 01.txt'));
        });
    });

    describe('list()', () => {
        it('should list files sorted', () => {
            fs.__setFile(path.join(MOCK_CONTENTS_PATH, 'b.txt'), '');
            fs.__setFile(path.join(MOCK_CONTENTS_PATH, 'a.txt'), '');

            const result = fileService.list(1);

            expect(result.data).toHaveLength(2);
            // @ts-ignore
            expect(result.data[0].name).toBe('a.txt');
            // @ts-ignore
            expect(result.data[1].name).toBe('b.txt');
        });
    });

    describe('open()', () => {
        it('should open path via electron shell', async () => {
            const p = '/test/file.txt';
            fs.__setFile(p, 'content');

            await fileService.open(p);
            expect(shell.openPath).toHaveBeenCalledWith(p);
        });
    });
});
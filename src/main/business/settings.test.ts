import { describe, it, expect, vi, beforeEach } from 'vitest';

// Activate Mocks
vi.mock('electron-log');
vi.mock('../database');

import * as settingsService from './settings';

import * as db from '../database';
import log from 'electron-log';

describe('Settings Business Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('list()', () => {
        it('should return all settings successfully', () => {
            const mockSettings = { theme: 'dark', language: 'en' };
            vi.mocked(db.getAllSettings).mockReturnValue(mockSettings as any);

            const result = settingsService.list();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockSettings);
            expect(db.getAllSettings).toHaveBeenCalled();
        });

        it('should handle errors when listing settings', () => {
            const error = new Error('DB Error');
            vi.mocked(db.getAllSettings).mockImplementation(() => {
                throw error;
            });

            const result = settingsService.list();

            expect(result.success).toBe(false);
            expect(result.error).toBe('DB Error');
            expect(log.error).toHaveBeenCalledWith('Error getting settings:', error);
        });
    });

    describe('get()', () => {
        it('should return a specific setting value', () => {
            vi.mocked(db.getSetting).mockReturnValue('dark');

            const result = settingsService.get('theme');

            expect(result.success).toBe(true);
            expect(result.value).toBe('dark');
            expect(db.getSetting).toHaveBeenCalledWith('theme');
        });

        it('should return null/undefined if setting does not exist (depending on DB impl)', () => {
            vi.mocked(db.getSetting).mockReturnValue(null as any);

            const result = settingsService.get('non_existent');

            expect(result.success).toBe(true);
            expect(result.value).toBeNull();
        });

        it('should handle errors when getting a setting', () => {
            const error = new Error('Read Error');
            vi.mocked(db.getSetting).mockImplementation(() => {
                throw error;
            });

            const result = settingsService.get('theme');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Read Error');
            expect(log.error).toHaveBeenCalledWith('Error setting:', error);
        });
    });

    describe('set()', () => {
        it('should set a setting successfully', () => {
            const result = settingsService.set('theme', 'light');

            expect(result.success).toBe(true);
            expect(db.setSetting).toHaveBeenCalledWith('theme', 'light');
        });

        it('should handle errors when setting a value', () => {
            const error = new Error('Write Error');
            vi.mocked(db.setSetting).mockImplementation(() => {
                throw error;
            });

            const result = settingsService.set('theme', 'light');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Write Error');
            expect(log.error).toHaveBeenCalledWith('Error setting:', error);
        });
    });
});
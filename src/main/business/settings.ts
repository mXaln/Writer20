import log from "electron-log";
import * as db from '../database';

export function list() {
    try {
        const settings = db.getAllSettings();
        return { success: true, data: settings };
    } catch (error: any) {
        log.error('Error getting settings:', error);
        return { success: false, error: error.message };
    }
}

export function get(key: string) {
    try {
        return { success: true, value: db.getSetting(key) };
    } catch (error: any) {
        log.error('Error setting:', error);
        return { success: false, error: error.message };
    }
}

export function set(key: string, value: string) {
    try {
        db.setSetting(key, value);
        return { success: true };
    } catch (error: any) {
        log.error('Error setting:', error);
        return { success: false, error: error.message };
    }
}
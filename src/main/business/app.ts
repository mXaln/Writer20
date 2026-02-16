import {app} from "electron";
import path from "path";

export function getAppDataDir(): string {
    return path.join(app.getPath('home'), 'Writer20');
}

export function getPath(name: string) {
    try {
        return { success: true, data: app.getPath(name as any) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
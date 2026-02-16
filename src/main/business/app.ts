import {app} from "electron";

export function getPath(name: string) {
    try {
        return { success: true, data: app.getPath(name as any) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
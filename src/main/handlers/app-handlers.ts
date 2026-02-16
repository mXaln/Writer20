import {ipcMain} from "electron";
import * as App from "../business/app";
import log from "electron-log";

export function setupAppHandlers(): void {
    ipcMain.handle('app:getPath', async (_event, name: string) => {
        return App.getPath(name);
    });

    log.info('App handlers registered');
}
import log from 'electron-log';
import { setupProjectHandlers } from './handlers/project-handlers';
import { setupFileHandlers } from './handlers/file-handlers';
import { setupSettingsHandlers } from './handlers/settings-handlers';
import {setupAppHandlers} from "./handlers/app-handlers";

export function setupIpcHandlers(): void {
  setupAppHandlers();
  setupProjectHandlers();
  setupFileHandlers();
  setupSettingsHandlers();
  log.info('All IPC handlers registered');
}

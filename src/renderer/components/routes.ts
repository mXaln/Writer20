/**
 * Application route constants
 */

export class Routes {
    static readonly DASHBOARD = '/';
    static readonly WORKFLOW = '/workflow/:projectId';
    static readonly SETTINGS= '/settings';

    static getWorkflowPath (projectId: number) {
        return Routes.WORKFLOW.replace(":projectId", projectId.toString());
    }

    static getBase = (route: string) => route.split('/:')[0];
}

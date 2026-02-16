import * as db from '../database';
import log from "electron-log";
import path from "path";
import {app} from "electron";
import fs from "fs";
import simpleGit from "simple-git";
import archiver from "archiver";
import extract from "extract-zip";

export async function create(language: string, book: string, type: string) {
    try {
        // Check if project with same language/book/type exists
        const existing = db.getProjectByLanguageBookType(language, book, type);
        if (existing) {
            return { success: false, error: 'Project with this identifier already exists' };
        }

        // Create project in database
        const project = db.createProject(language, book, type);
        log.info(`Creating project: ${project.name}`);

        // Create project folder in ~/Writer20 using project.name
        const appPath = path.join(app.getPath('home'), 'Writer20', project.name);
        if (!fs.existsSync(appPath)) {
            fs.mkdirSync(appPath, { recursive: true });
            log.info(`Created project folder: ${appPath}`);
        }

        // Create manifest.json file
        const manifest = {
            package_version: 1,
            format: "usfm",
            generator: {
                name: "writer20",
                build: "1"
            },
            target_language: {
                id: language
            },
            project: {
                id: book
            },
            type: {
                id: "text",
                name: "Text"
            },
            resource: {
                id: type,
                name: type
            }
        };
        const manifestPath = path.join(appPath, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        log.info(`Created manifest.json: ${manifestPath}`);

        // Initialize git repository
        try {
            const git = simpleGit(appPath);
            await git.init();
            await git.add('.');
            await git.commit('Initial commit');
            log.info(`Initialized git repository: ${appPath}`);
        } catch (gitError: any) {
            log.error(`Git init error: ${gitError.message}`);
        }

        return { success: true, data: project };
    } catch (error: any) {
        log.error('Error creating project:', error);
        return { success: false, error: error.message };
    }
}

export function list() {
    try {
        const projects = db.getAllProjects();
        return { success: true, data: projects };
    } catch (error: any) {
        log.error('Error listing projects:', error);
        return { success: false, error: error.message };
    }
}

export function get(id: number) {
    try {
        const project = db.getProject(id);
        if (!project) {
            return { success: false, error: 'Project not found' };
        }
        return { success: true, data: project };
    } catch (error: any) {
        log.error('Error getting project:', error);
        return { success: false, error: error.message };
    }
}

export function remove(id: number) {
    try {
        const project = db.getProject(id);
        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        // Delete project folder
        const appPath = path.join(app.getPath('home'), 'Writer20', project.name);
        if (fs.existsSync(appPath)) {
            fs.rmSync(appPath, { recursive: true, force: true });
            log.info(`Deleted project folder: ${appPath}`);
        }

        db.deleteProject(id);
        return { success: true };
    } catch (error: any) {
        log.error('Error deleting project:', error);
        return { success: false, error: error.message };
    }
}

export async function exportProject(project: any, destinationPath: string) {
    try {
        const projectFolder = path.join(app.getPath('home'), 'Writer20', project.name);
        if (!fs.existsSync(projectFolder)) {
            return { success: false, error: 'Project folder not found' };
        }

        // Create zip file
        const output = fs.createWriteStream(destinationPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve) => {
            output.on('close', () => {
                log.info(`Exported project ${project.name} to ${destinationPath}`);
                resolve({ success: true, data: destinationPath });
            });

            archive.on('error', (err: any) => {
                log.error('Error creating zip:', err);
                resolve({ success: false, error: err.message });
            });

            archive.pipe(output);
            archive.directory(projectFolder, false);
            archive.finalize();
        });
    } catch (error: any) {
        log.error('Error exporting project:', error);
        return { success: false, error: error.message };
    }
}

export async function importProject(zipPath: string) {
    try {
        if (!fs.existsSync(zipPath)) {
            return { success: false, error: 'Import file not found' };
        }

        // Create temp folder for extraction
        const tempFolder = path.join(app.getPath('temp'), `writer20-import-${Date.now()}`);
        fs.mkdirSync(tempFolder, { recursive: true });

        // Extract ZIP file
        await extract(zipPath, { dir: tempFolder });

        // Look for manifest.json in extracted content
        const manifestPath = path.join(tempFolder, 'manifest.json');
        let language = 'en';
        let book = 'mat';
        let resource = 'ulb';

        if (fs.existsSync(manifestPath)) {
            const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);

            if (manifest.target_language?.id) {
                language = manifest.target_language.id;
            }
            if (manifest.project?.id) {
                book = manifest.project.id;
            }
            if (manifest.resource?.id) {
                resource = manifest.resource.id;
            }
        }

        // Check if project with same language/book/resource exists
        const existing = db.getProjectByLanguageBookType(language, book, resource);
        if (existing) {
            // Cleanup temp folder
            fs.rmSync(tempFolder, { recursive: true, force: true });
            return { success: false, error: 'Project with this identifier already exists' };
        }

        // Create project in database
        const project = db.createProject(language, book, resource);

        // Create project folder
        const projectFolder = path.join(app.getPath('home'), 'Writer20', project.name);
        if (!fs.existsSync(projectFolder)) {
            fs.mkdirSync(projectFolder, { recursive: true });
        }

        // Create contents folder
        const contentsFolder = path.join(projectFolder, 'contents');
        if (!fs.existsSync(contentsFolder)) {
            fs.mkdirSync(contentsFolder, { recursive: true });
        }

        // Move files from temp to contents folder
        const tempContentsFolder = path.join(tempFolder, 'contents');
        if (fs.existsSync(tempContentsFolder)) {
            // If ZIP has contents folder, copy from there
            const files = fs.readdirSync(tempContentsFolder);
            for (const file of files) {
                const srcPath = path.join(tempContentsFolder, file);
                const destPath = path.join(contentsFolder, file);
                fs.copyFileSync(srcPath, destPath);
            }
        } else {
            // Otherwise, copy from root of temp folder (skip manifest)
            const files = fs.readdirSync(tempFolder);
            for (const file of files) {
                if (file !== 'manifest.json') {
                    const srcPath = path.join(tempFolder, file);
                    const destPath = path.join(contentsFolder, file);
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        }

        // Cleanup temp folder
        fs.rmSync(tempFolder, { recursive: true, force: true });

        // Create/update manifest.json
        const newManifestPath = path.join(projectFolder, 'manifest.json');
        const manifest = {
            package_version: 1,
            format: "usfm",
            generator: {
                name: "writer20",
                build: "1"
            },
            target_language: {
                id: language
            },
            project: {
                id: book
            },
            type: {
                id: "text",
                name: "Text"
            },
            resource: {
                id: resource,
                name: resource
            }
        };
        fs.writeFileSync(newManifestPath, JSON.stringify(manifest, null, 2));

        log.info(`Imported project ${project.name} from ${zipPath}`);

        return { success: true, data: project };
    } catch (error: any) {
        log.error('Error importing project:', error);
        return { success: false, error: error.message };
    }
}
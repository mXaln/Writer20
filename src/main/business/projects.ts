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
        if (!existing) {
            // No existing project - proceed with normal import
            fs.rmSync(tempFolder, { recursive: true, force: true });
            return await importProjectNew(language, book, resource, zipPath);
        }

        // Project exists - check for conflicts
        const projectFolder = path.join(app.getPath('home'), 'Writer20', existing.name);
        const contentsFolder = path.join(projectFolder, 'contents');
        
        // Get existing files
        const existingFiles = fs.existsSync(contentsFolder) 
            ? fs.readdirSync(contentsFolder).filter(f => f.endsWith('.txt'))
            : [];
        
        // Get imported files
        const tempContentsFolder = path.join(tempFolder, 'contents');
        let importedFiles: string[] = [];
        if (fs.existsSync(tempContentsFolder)) {
            importedFiles = fs.readdirSync(tempContentsFolder).filter(f => f.endsWith('.txt'));
        } else {
            importedFiles = fs.readdirSync(tempFolder)
                .filter(f => f.endsWith('.txt') && f !== 'manifest.json');
        }

        // Find conflicts (files that exist in both and have different content)
        const conflicts: Array<{
            fileId: string;
            fileName: string;
            filePath: string;
            currentContent: string;
            importedContent: string;
        }> = [];

        for (const fileName of importedFiles) {
            const importedPath = fs.existsSync(tempContentsFolder)
                ? path.join(tempContentsFolder, fileName)
                : path.join(tempFolder, fileName);
            
            const existingPath = path.join(contentsFolder, fileName);
            
            if (existingFiles.includes(fileName)) {
                // File exists in both - compare content
                const existingContent = fs.existsSync(existingPath) 
                    ? fs.readFileSync(existingPath, 'utf-8') 
                    : '';
                const importedContent = fs.readFileSync(importedPath, 'utf-8');
                
                if (existingContent !== importedContent) {
                    conflicts.push({
                        fileId: fileName,
                        fileName: fileName,
                        filePath: existingPath,
                        currentContent: existingContent,
                        importedContent: importedContent
                    });
                }
            }
        }

        // Cleanup temp folder
        fs.rmSync(tempFolder, { recursive: true, force: true });

        if (conflicts.length > 0) {
            // Return conflict information
            return { 
                success: true, 
                data: {
                    hasConflicts: true,
                    projectId: existing.id,
                    conflicts: conflicts
                }
            };
        }

        // No conflicts - merge silently (imported files overwrite existing)
        return await importProjectMerge(existing.id, zipPath);
    } catch (error: any) {
        log.error('Error importing project:', error);
        return { success: false, error: error.message };
    }
}

async function importProjectNew(language: string, book: string, resource: string, zipPath: string): Promise<{success: boolean; data?: any; error?: string}> {
    // This is the original import logic for new projects
    const tempFolder = path.join(app.getPath('temp'), `writer20-import-${Date.now()}`);
    fs.mkdirSync(tempFolder, { recursive: true });

    await extract(zipPath, { dir: tempFolder });

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
        const files = fs.readdirSync(tempContentsFolder);
        for (const file of files) {
            const srcPath = path.join(tempContentsFolder, file);
            const destPath = path.join(contentsFolder, file);
            fs.copyFileSync(srcPath, destPath);
        }
    } else {
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

    log.info(`Imported new project ${project.name} from ${zipPath}`);

    return { success: true, data: project };
}

async function importProjectMerge(projectId: number, zipPath: string): Promise<{success: boolean; data?: any; error?: string}> {
    // Merge imported files into existing project
    const project = db.getProject(projectId);
    if (!project) {
        return { success: false, error: 'Project not found' };
    }

    const tempFolder = path.join(app.getPath('temp'), `writer20-import-${Date.now()}`);
    fs.mkdirSync(tempFolder, { recursive: true });

    await extract(zipPath, { dir: tempFolder });

    const projectFolder = path.join(app.getPath('home'), 'Writer20', project.name);
    const contentsFolder = path.join(projectFolder, 'contents');

    // Copy files from temp to contents folder (overwriting existing)
    const tempContentsFolder = path.join(tempFolder, 'contents');
    if (fs.existsSync(tempContentsFolder)) {
        const files = fs.readdirSync(tempContentsFolder);
        for (const file of files) {
            const srcPath = path.join(tempContentsFolder, file);
            const destPath = path.join(contentsFolder, file);
            fs.copyFileSync(srcPath, destPath);
        }
    } else {
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

    log.info(`Merged imported project ${project.name} from ${zipPath}`);

    return { success: true, data: project };
}

export async function resolveConflict(filePath: string, acceptedContent: string) {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }

        // Write the accepted content to the file
        fs.writeFileSync(filePath, acceptedContent, 'utf-8');
        
        log.info(`Resolved conflict for file: ${filePath}`);
        return { success: true };
    } catch (error: any) {
        log.error('Error resolving conflict:', error);
        return { success: false, error: error.message };
    }
}
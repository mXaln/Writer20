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

        // Project exists - return that it exists and needs user choice
        // Don't do any merge yet - just tell the frontend the project exists
        fs.rmSync(tempFolder, { recursive: true, force: true });
        
        return {
            success: true,
            data: {
                projectExists: true,
                projectId: existing.id,
                projectName: existing.name,
                zipPath: zipPath
            }
        };
    } catch (error: any) {
        log.error('Error importing project:', error);
        return { success: false, error: error.message };
    }
}

function detectGitConflicts(projectFolder: string, conflictFiles: string[]): Array<{
    fileId: string;
    fileName: string;
    filePath: string;
    currentContent: string;
    importedContent: string;
}> {
    const conflicts: Array<{
        fileId: string;
        fileName: string;
        filePath: string;
        currentContent: string;
        importedContent: string;
    }> = [];
    
    const contentsFolder = path.join(projectFolder, 'contents');
    
    for (const file of conflictFiles) {
        const filePath = path.join(contentsFolder, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // Parse conflict markers
            const { current, imported } = parseGitConflictMarkers(content);
            
            if (current || imported) {
                conflicts.push({
                    fileId: file,
                    fileName: file,
                    filePath: filePath,
                    currentContent: current || '',
                    importedContent: imported || ''
                });
            }
        }
    }
    
    return conflicts;
}

function parseGitConflictMarkers(content: string): { current: string | null; imported: string | null } {
    const lines = content.split('\n');
    let current: string[] = [];
    let imported: string[] = [];
    let inCurrent = false;
    let inImported = false;
    
    for (const line of lines) {
        if (line.startsWith('<<<<<<<')) {
            inCurrent = true;
            inImported = false;
        } else if (line.startsWith('=======')) {
            inCurrent = false;
            inImported = true;
        } else if (line.startsWith('>>>>>>>')) {
            inImported = false;
        } else if (inCurrent) {
            current.push(line);
        } else if (inImported) {
            imported.push(line);
        }
    }
    
    return {
        current: current.length > 0 ? current.join('\n') : null,
        imported: imported.length > 0 ? imported.join('\n') : null
    };
}

// Fallback: Simple file comparison when git merge fails
async function importProjectWithFileMerge(projectId: number, zipPath: string): Promise<{success: boolean; data?: any; error?: string}> {
    const tempFolder = path.join(app.getPath('temp'), `writer20-import-${Date.now()}`);
    fs.mkdirSync(tempFolder, { recursive: true });
    
    await extract(zipPath, { dir: tempFolder });
    
    const project = db.getProject(projectId);
    if (!project) {
        fs.rmSync(tempFolder, { recursive: true, force: true });
        return { success: false, error: 'Project not found' };
    }
    
    const projectFolder = path.join(app.getPath('home'), 'Writer20', project.name);
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
    
    fs.rmSync(tempFolder, { recursive: true, force: true });
    
    if (conflicts.length > 0) {
        return {
            success: true,
            data: {
                hasConflicts: true,
                projectId: project.id,
                conflicts: conflicts,
                mergeFailed: false
            }
        };
    }
    
    // No conflicts - merge
    return await importProjectMerge(projectId, zipPath);
}

export async function importWithOption(projectId: number, zipPath: string, option: 'overwrite' | 'merge' | 'cancel') {
    if (option === 'cancel') {
        return { success: true, canceled: true };
    }
    
    if (option === 'overwrite') {
        // Overwrite local files with imported version
        return await importProjectMerge(projectId, zipPath);
    }
    
    if (option === 'merge') {
        // Try git merge to detect conflicts
        const project = db.getProject(projectId);
        if (!project) {
            return { success: false, error: 'Project not found' };
        }
        
        const projectFolder = path.join(app.getPath('home'), 'Writer20', project.name);
        
        // Create temp folder for extraction
        const tempFolder = path.join(app.getPath('temp'), `writer20-import-${Date.now()}`);
        fs.mkdirSync(tempFolder, { recursive: true });
        
        try {
            // Extract ZIP
            await extract(zipPath, { dir: tempFolder });
            
            const git = simpleGit(projectFolder);
            
            // Check if project has git repo
            let isRepo = await git.checkIsRepo();
            if (!isRepo) {
                await git.init();
                await git.add('.');
                await git.commit('Initial commit');
                isRepo = true;
            }
            
            // Get current branch
            const branchResult = await git.branchLocal();
            const mainBranch = branchResult.current;
            
            // Check if imported zip has git repository
            const importedGit = simpleGit(tempFolder);
            const importedIsRepo = await importedGit.checkIsRepo();
            
            if (importedIsRepo) {
                // Get imported branch
                const importedBranches = await importedGit.branchLocal();
                const importedBranch = importedBranches.current;

                // Add imported repo as a remote
                const remoteName = 'imported';
                try {
                    await git.addRemote(remoteName, tempFolder);
                } catch (e) {
                    // Remote might already exist, try to set URL
                    await git.removeRemote(remoteName);
                    await git.addRemote(remoteName, tempFolder);
                }
                
                // Fetch from imported remote to get all refs
                await git.fetch(remoteName);
                
                // Save local manifest.json content before merge
                const localManifestPath = path.join(projectFolder, 'manifest.json');
                const localManifestContent = fs.existsSync(localManifestPath) 
                    ? fs.readFileSync(localManifestPath, 'utf-8') 
                    : null;
                
                // Try merge - it may throw on conflicts but we can still check status
                let mergeError: any = null;
                try {
                    // Use --no-commit to stop before auto-committing, allowing us to detect all conflicts
                    // Use --allow-unrelated-histories since repos may not share common commits
                    await git.merge(['--no-commit', '--allow-unrelated-histories', `${remoteName}/${importedBranch}`]);
                } catch (error: any) {
                    mergeError = error;
                }
                
                // Always use local manifest.json (ours) - exclude from merge
                const manifestPath = path.join(projectFolder, 'manifest.json');
                if (localManifestContent) {
                    fs.writeFileSync(manifestPath, localManifestContent, 'utf-8');
                    await git.add('manifest.json');
                }
                
                // Check for conflicts by looking at git status (works even if merge threw)
                const status = await git.status();
                let conflictedFiles = status.conflicted || [];
                
                // If status.conflicted is empty but merge error exists, parse conflicted files from error message
                // Error format: "CONFLICTS: file1:add/add, file2:add/add, ..."
                if (conflictedFiles.length === 0 && mergeError && mergeError.message) {
                    const conflictMatch = mergeError.message.match(/CONFLICTS: (.+)/);
                    if (conflictMatch) {
                        const conflictParts = conflictMatch[1].split(',').map((s: string) => s.trim());
                        conflictedFiles = conflictParts.map((s: string) => {
                            // Extract file path from "file:add/add" or "file:modify/modify"
                            const filePart = s.split(':')[0].trim();
                            // Remove any leading path components to get just filename
                            return filePart.split('/').pop() || filePart;
                        });
                    }
                }
                
                // Clean up remote
                try {
                    await git.removeRemote(remoteName);
                } catch (e) {
                    // Ignore
                }
                
                if (conflictedFiles.length > 0) {
                    // There are merge conflicts! (detected via git conflict markers in files)
                    const conflictFilePaths = conflictedFiles.map((f: string) => path.basename(f));
                    const conflicts = detectGitConflicts(projectFolder, conflictFilePaths);
                    
                    fs.rmSync(tempFolder, { recursive: true, force: true });
                    
                    return {
                        success: true,
                        data: {
                            mergedWithConflicts: true,
                            projectId: project.id,
                            conflicts: conflicts
                        }
                    };
                }
                
                // No conflicts - commit the merge
                await git.add('.');
                await git.commit(`Merge: ${importedBranch} into ${mainBranch}`);
                
                // No conflicts - merge was successful
                fs.rmSync(tempFolder, { recursive: true, force: true });
                log.info(`Merged imported project ${project.name} from ${zipPath}`);
                
                return { success: true, data: project };
            }
            
            // Fall back to simple file comparison if no git in imported
            fs.rmSync(tempFolder, { recursive: true, force: true });
            return await importProjectWithFileMerge(projectId, zipPath);
            
        } catch (error: any) {
            log.error('Merge import error:', error);
            
            // Abort any failed merge and clean up
            try {
                const git = simpleGit(projectFolder);
                await git.merge(['--abort']);
                await git.removeRemote('imported');
            } catch (e) {
                // Ignore cleanup errors
            }
            
            // Fall back to simple file comparison
            fs.rmSync(tempFolder, { recursive: true, force: true });
            return await importProjectWithFileMerge(projectId, zipPath);
        }
    }
    
    return { success: false, error: 'Invalid option' };
}

// Helper function to extract zip and copy files to contents folder
async function extractAndCopyFiles(zipPath: string, projectFolder: string): Promise<string> {
    const tempFolder = path.join(app.getPath('temp'), `writer20-import-${Date.now()}`);
    fs.mkdirSync(tempFolder, { recursive: true });

    await extract(zipPath, { dir: tempFolder });

    const contentsFolder = path.join(projectFolder, 'contents');
    if (!fs.existsSync(contentsFolder)) {
        fs.mkdirSync(contentsFolder, { recursive: true });
    }

    // Copy files from temp to contents folder
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
                if (fs.statSync(srcPath).isFile()) {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        }
    }

    return tempFolder;
}

// Helper function to create manifest.json
function createManifest(projectFolder: string, language: string, book: string, resource: string): void {
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
    const manifestPath = path.join(projectFolder, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

async function importProjectNew(language: string, book: string, resource: string, zipPath: string): Promise<{success: boolean; data?: any; error?: string}> {
    // This is the original import logic for new projects
    // Create project in database
    const project = db.createProject(language, book, resource);

    // Create project folder
    const projectFolder = path.join(app.getPath('home'), 'Writer20', project.name);
    if (!fs.existsSync(projectFolder)) {
        fs.mkdirSync(projectFolder, { recursive: true });
    }

    // Extract zip and copy files
    const tempFolder = await extractAndCopyFiles(zipPath, projectFolder);

    // Cleanup temp folder
    fs.rmSync(tempFolder, { recursive: true, force: true });

    // Create manifest.json
    createManifest(projectFolder, language, book, resource);

    // Initialize git repository
    try {
        const git = simpleGit(projectFolder);
        await git.init();
        await git.add('.');
        await git.commit('Initial commit');
        log.info(`Initialized git repository: ${projectFolder}`);
    } catch (gitError: any) {
        log.error(`Git init error: ${gitError.message}`);
    }

    log.info(`Imported new project ${project.name} from ${zipPath}`);

    return { success: true, data: project };
}

async function importProjectMerge(projectId: number, zipPath: string): Promise<{success: boolean; data?: any; error?: string}> {
    // Merge imported files into existing project (overwrite)
    const project = db.getProject(projectId);
    if (!project) {
        return { success: false, error: 'Project not found' };
    }

    const projectFolder = path.join(app.getPath('home'), 'Writer20', project.name);

    // Extract zip and copy files
    const tempFolder = await extractAndCopyFiles(zipPath, projectFolder);

    // Cleanup temp folder
    fs.rmSync(tempFolder, { recursive: true, force: true });

    log.info(`Merged imported project ${project.name} from ${zipPath}`);

    return { success: true, data: project };
}

import * as db from "../database";
import path from "path";
import {app, shell} from "electron";
import {getAppDataDir} from './app';
import fs from "fs";
import log from "electron-log";
import simpleGit from "simple-git";
import { ErrorCode } from '../error-codes';

// Helper to get project and ensure contents folder exists
function getProjectContentsFolder(projectId: number): { projectPath: string; contentsPath: string } | { error: string } {
    const project = db.getProject(projectId);
    if (!project) {
        return { error: ErrorCode.PROJECT_NOT_FOUND };
    }

    const projectPath = path.join(getAppDataDir(), project.name);
    const contentsPath = path.join(projectPath, 'contents');

    // Ensure contents folder exists
    if (!fs.existsSync(contentsPath)) {
        fs.mkdirSync(contentsPath, { recursive: true });
    }

    return { projectPath: projectPath, contentsPath: contentsPath };
}

export function create(projectId: number) {
    try {
        const projectResult = getProjectContentsFolder(projectId);
        if ('error' in projectResult) {
            return { success: false, error: projectResult.error };
        }

        const { contentsPath } = projectResult;

        // Get existing files from contents folder
        const existingFiles = fs.readdirSync(contentsPath)
            .filter(f => fs.statSync(path.join(contentsPath, f)).isFile());

        let nextNum = 1;

        // Find the next available number
        const existingNumbers = new Set(
            existingFiles
                .map((f: string) => {
                    const match = f.match(/^(\d+)\.txt$/);
                    return match ? parseInt(match[1], 10) : null;
                })
                .filter((n: number | null): n is number => n !== null)
        );

        while (existingNumbers.has(nextNum)) {
            nextNum++;
        }

        // Generate filename with zero-padded number
        const fileName = `${String(nextNum).padStart(2, '0')}.txt`;
        const filePath = path.join(contentsPath, fileName);

        // Create empty file
        fs.writeFileSync(filePath, '', 'utf-8');

        const project = db.getProject(projectId);
        log.info(`Created file: ${fileName} in project ${project?.name}/contents`);

        return { success: true, data: { id: fileName, name: fileName, path: filePath } };
    } catch (error: any) {
        log.error('Error creating file:', error);
        return { success: false, error: error.message };
    }
}

export function read(filePath: string) {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: ErrorCode.FILE_NOT_FOUND };
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return { success: true, data: content };
    } catch (error: any) {
        log.error('Error reading file:', error);
        return { success: false, error: error.message };
    }
}

export async function write(filePath: string, content: string) {
    try {
        // Extract project folder from file path
        const projectPath = path.dirname(path.dirname(filePath));
        const fileName = path.basename(filePath);
        const relativePath = path.join('contents', fileName);

        const fileExistedBefore = fs.existsSync(filePath);

        // Write file regardless
        fs.writeFileSync(filePath, content, 'utf-8');
        log.info(`Saved file: ${filePath}`);

        // Commit changes to git if content is not empty or file didn't exist
        if (content.trim() || !fileExistedBefore) {
            try {
                const git = simpleGit(projectPath);
                await git.add(relativePath);
                await git.commit(`Update ${fileName}`);
                log.info(`Committed: ${fileName}`);
            } catch (gitError: any) {
                log.error(`Git error: ${gitError.message}`);
            }
        }
        return { success: true };
    } catch (error: any) {
        log.error('Error writing file:', error);
        return { success: false, error: error.message };
    }
}

export function list(projectId: number) {
    try {
        const project = db.getProject(projectId);
        if (!project) {
            return { success: false, error: ErrorCode.PROJECT_NOT_FOUND };
        }

        const projectPath = path.join(getAppDataDir(), project.name);
        const contentsPath = path.join(projectPath, 'contents');

        if (!fs.existsSync(contentsPath)) {
            return { success: true, data: [] };
        }

        const files = fs.readdirSync(contentsPath)
            .filter(f => fs.statSync(path.join(contentsPath, f)).isFile())
            .map(f => ({
                id: f,
                name: f,
                path: path.join(contentsPath, f)
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return { success: true, data: files };
    } catch (error: any) {
        log.error('Error listing files:', error);
        return { success: false, error: error.message };
    }
}

export function listWithContent(projectId: number) {
    try {
        const projectResult = getProjectContentsFolder(projectId);
        if ('error' in projectResult) {
            return { success: false, error: projectResult.error };
        }

        const { contentsPath } = projectResult;

        // Generate 100 items
        const items: Array<{id: string; name: string; path: string; content: string}> = [];
        for (let i = 1; i <= 100; i++) {
            const fileName = `${String(i).padStart(2, '0')}.txt`;
            const filePath = path.join(contentsPath, fileName);

            // Read content if file exists
            let content = '';
            if (fs.existsSync(filePath)) {
                content = fs.readFileSync(filePath, 'utf-8');
            }

            items.push({
                id: fileName,
                name: fileName,
                path: filePath,
                content: content
            });
        }

        return { success: true, data: items };
    } catch (error: any) {
        log.error('Error listing files with content:', error);
        return { success: false, error: error.message };
    }
}

export async function open(filePath: string) {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return { success: false, error: ErrorCode.FILE_NOT_FOUND };
        }

        // Open with system default application
        await shell.openPath(filePath);
        log.info(`Opened file: ${filePath}`);
        return { success: true };
    } catch (error: any) {
        log.error('Error opening file:', error);
        return { success: false, error: error.message };
    }
}

export function remove(filePath: string, deleteFromDisk: boolean) {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: ErrorCode.FILE_NOT_FOUND };
        }

        // Delete from disk
        if (deleteFromDisk) {
            fs.unlinkSync(filePath);
            log.info(`Deleted file from disk: ${filePath}`);
        }

        return { success: true };
    } catch (error: any) {
        log.error('Error removing file:', error);
        return { success: false, error: error.message };
    }
}

export function getConflictedFiles(projectId: number): string[] {
    const project = db.getProject(projectId);
    if (!project) {
        return [];
    }
    
    // Scan contents folder for files with git conflict markers
    const projectPath = path.join(getAppDataDir(), project.name);
    const contentsPath = path.join(projectPath, 'contents');
    
    if (!fs.existsSync(contentsPath)) {
        return [];
    }
    
    const files = fs.readdirSync(contentsPath);
    const conflictedFiles: string[] = [];
    
    for (const file of files) {
        if (!file.endsWith('.txt')) continue;
        
        const filePath = path.join(contentsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for conflict markers
        if (content.includes('<<<<<<<') && content.includes('=======') && content.includes('>>>>>>>')) {
            conflictedFiles.push(file);
        }
    }
    
    return conflictedFiles;
}

export async function resolveConflict(filePath: string, acceptedContent: string, projectId: number) {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: ErrorCode.FILE_NOT_FOUND };
        }

        // Write the accepted content to the file (removes conflict markers)
        fs.writeFileSync(filePath, acceptedContent, 'utf-8');
        
        let mergeComplete = false;
        
        // Git add the resolved file and check if all conflicts are resolved
        const project = db.getProject(projectId);
        if (project) {
            const projectPath = path.join(getAppDataDir(), project.name);
            const git = simpleGit(projectPath);
            
            // Get the path relative to project root (handle files in contents/ subfolder)
            const fileName = path.basename(filePath);
            const contentsPath = path.join(projectPath, 'contents');
            let gitPath: string;
            
            if (filePath.includes(contentsPath) || filePath.includes('contents\\')) {
                // File is in contents folder - use contents/filename
                gitPath = path.join('contents', fileName);
            } else {
                // Assume it's in project root
                gitPath = fileName;
            }
            
            await git.add(gitPath);
            
            // Check if there are any remaining conflicted files
            const remainingConflictedFiles = getConflictedFiles(projectId);
            
            if (remainingConflictedFiles.length === 0) {
                // All conflicts resolved - complete the merge
                await git.commit('Resolved merge conflicts');
                mergeComplete = true;
                log.info(`Merge completed for project ${project.name}`);
            }
        }
        
        log.info(`Resolved conflict for file: ${filePath}`);
        return { success: true, mergeComplete };
    } catch (error: any) {
        log.error('Error resolving conflict:', error);
        return { success: false, error: error.message };
    }
}
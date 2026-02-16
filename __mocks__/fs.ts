/// <reference types="node" />
import { vi } from 'vitest';
import * as path from 'path';
import {EventEmitter} from "events";

// --- Internal State ---
// We use a Map to simulate the disk
const files = new Map<string, string>();
const dirs = new Set<string>();
const activeStreams = new Map<string, EventEmitter>();

// Helper to normalize paths so Windows/Mac don't fight
const n = (p: string) => path.normalize(p);

// --- Test Helpers ---
export function __reset() {
    files.clear();
    dirs.clear();
    activeStreams.clear();
}
export function __setFile(filePath: string, content: string) {
    files.set(n(filePath), content);
}
export function __setDir(dirPath: string) {
    dirs.add(n(dirPath));
}
export function __getFile(filePath: string) {
    return files.get(n(filePath));
}
export function __hasFile(filePath: string) {
    return files.has(n(filePath));
}
export function __getStream(filePath: string) {
    return activeStreams.get(n(filePath));
}

// --- Mocked FS Methods ---
export const existsSync = vi.fn((p: string) => {
    const normalized = n(p);
    return files.has(normalized) || dirs.has(normalized);
});

export const mkdirSync = vi.fn((p: string, options?: any) => {
    dirs.add(n(p));
    return p;
});

export const writeFileSync = vi.fn((p: string, content: string, encoding?: any) => {
    files.set(n(p), content);
});

export const readFileSync = vi.fn((p: string, encoding?: any) => {
    const normalized = n(p);
    if (!files.has(normalized)) throw new Error(`ENOENT: no such file or directory, open '${p}'`);
    return files.get(normalized);
});

export const unlinkSync = vi.fn((p: string) => {
    const normalized = n(p);
    if (!files.has(normalized)) throw new Error(`ENOENT: no such file or directory, unlink '${p}'`);
    files.delete(normalized);
});

export const statSync = vi.fn((p: string) => {
    const normalized = n(p);
    return {
        isFile: () => files.has(normalized),
        isDirectory: () => dirs.has(normalized),
    };
});

export const readdirSync = vi.fn((dirPath: string) => {
    const normalizedDir = n(dirPath);
    const result: string[] = [];

    files.forEach((_, key) => {
        // Check if the file starts with the directory path
        if (key.startsWith(normalizedDir)) {
            // Get the part AFTER the directory
            const relative = key.replace(normalizedDir, '');

            // Remove leading separator if present (e.g. "\file.txt" -> "file.txt")
            const cleanRelative = relative.startsWith(path.sep) ? relative.slice(path.sep.length) : relative;

            // Ensure it's a direct child (no remaining separators)
            if (cleanRelative && !cleanRelative.includes(path.sep)) {
                result.push(cleanRelative);
            }
        }
    });
    return result;
});

export const copyFileSync = vi.fn((src: string, dest: string) => {
    const content = files.get(n(src));
    if (content === undefined) throw new Error(`ENOENT: no such file or directory, copyfile '${src}' -> '${dest}'`);
    files.set(n(dest), content);
});

export const rmSync = vi.fn((p: string, options?: any) => {
    const normalized = n(p);
    // Simple recursive delete simulation
    dirs.delete(normalized);
    for (const key of files.keys()) {
        if (key.startsWith(normalized)) files.delete(key);
    }
    for (const key of dirs.keys()) {
        if (key.startsWith(normalized)) dirs.delete(key);
    }
});

export const createWriteStream = vi.fn((p: string) => {
    const emitter = new EventEmitter();
    activeStreams.set(n(p), emitter);
    (emitter as any).write = vi.fn();
    (emitter as any).end = vi.fn();
    (emitter as any).close = vi.fn();
    // Simulate stream lifecycle events if needed
    return emitter;
});

export default {
    existsSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    unlinkSync,
    statSync,
    readdirSync,
    copyFileSync,
    rmSync,
    createWriteStream,
    __reset,
    __setFile,
    __setDir,
    __getFile,
    __hasFile,
    __getStream
};
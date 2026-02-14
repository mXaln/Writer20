import { vi } from 'vitest';

export const existsSync = vi.fn(() => true);
export const mkdirSync = vi.fn();
// Add other fs methods here if your app uses them
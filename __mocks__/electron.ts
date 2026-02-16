import { vi } from 'vitest';

export const app = {
  getPath: vi.fn(() => '/tmp/fake-user-data'), // Default return value
  getName: vi.fn(() => 'TestApp'),
  getVersion: vi.fn(() => '1.0.0'),
};

export const shell = {
  openPath: vi.fn().mockResolvedValue(''), // Return empty string on success
  showItemInFolder: vi.fn(),
  openExternal: vi.fn(),
};

// Default export is often needed for compatibility
export default {
  app,
  shell,
};
import { vi } from 'vitest';

const gitInstance = {
  add: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue(undefined),
  init: vi.fn().mockResolvedValue(undefined),
};

// simple-git exports a factory function
export default vi.fn(() => gitInstance);
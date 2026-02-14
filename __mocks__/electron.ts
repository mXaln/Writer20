import { vi } from 'vitest';

export const app = {
  getPath: vi.fn(() => '/tmp/fake-user-data'),
};
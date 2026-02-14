import { vi } from 'vitest';

// 1. Create the spies for statement methods
export const mockRun = vi.fn();
export const mockGet = vi.fn();
export const mockAll = vi.fn();

// 2. The statement object returned by prepare()
export const mockStatement = {
  run: mockRun,
  get: mockGet,
  all: mockAll,
};

// 3. Create spies for Database class methods
export const mockPrepare = vi.fn(() => mockStatement);
export const mockExec = vi.fn();
export const mockPragma = vi.fn();
export const mockClose = vi.fn();

// 4. The Default Export (The Class)
export default class MockDatabase {
  constructor(path: string) {
    // Logic if needed
  }
  // Assign the shared spies to the instance
  prepare = mockPrepare;
  exec = mockExec;
  pragma = mockPragma;
  close = mockClose;
  open = true;
}
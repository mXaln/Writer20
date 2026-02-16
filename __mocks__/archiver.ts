import { vi } from 'vitest';

const mockArchive = {
    on: vi.fn(),
    pipe: vi.fn(),
    directory: vi.fn(),
    finalize: vi.fn().mockResolvedValue(undefined),
    // Add other methods if your app uses them (e.g. append, file)
};

// Archiver exports a factory function (e.g. archiver('zip'))
export default vi.fn(() => mockArchive);
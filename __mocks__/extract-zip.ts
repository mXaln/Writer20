import { vi } from 'vitest';

// Default export is an async function: await extract(source, { dir: ... })
export default vi.fn().mockResolvedValue(undefined);
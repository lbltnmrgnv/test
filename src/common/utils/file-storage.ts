import { promises as fs } from 'node:fs';
import { dirname } from 'path';

export async function ensureJsonFile<T>(
  filePath: string,
  defaultValue: T,
): Promise<void> {
  await fs.mkdir(dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
  }
}


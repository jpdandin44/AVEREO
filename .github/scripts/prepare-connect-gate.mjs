import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const application = String(process.argv[2] || '').trim().toLowerCase();
if (!['projet', 'thermo', 'drone'].includes(application)) {
  throw new Error('Application de sas inconnue.');
}

const repositoryRoot = resolve(import.meta.dirname, '..', '..');
const source = resolve(
  repositoryRoot,
  'architecture-v1',
  'avereo-platform',
  'shared',
  'connect-gate.php',
);
const targetDirectory = resolve(
  repositoryRoot,
  'architecture-v1',
  `avereo-app-${application}`,
  'frontend',
  'public',
  'connect',
);

await mkdir(targetDirectory, { recursive: true });
await copyFile(source, resolve(targetDirectory, 'gate.php'));


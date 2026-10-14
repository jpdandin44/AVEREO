import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source = new URL('../../avereo-platform/shared/connect-gate.php', import.meta.url);
const target = new URL('../frontend/public/connect/', import.meta.url);
await mkdir(target, { recursive: true });
await copyFile(source, new URL('gate.php', target));
console.log(`Sas CONNECT Passeport Immo préparé : ${fileURLToPath(target)}`);

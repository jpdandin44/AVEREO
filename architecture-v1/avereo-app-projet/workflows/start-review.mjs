import { existsSync } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = resolve(appRoot, '../..');
const args = process.argv.slice(2);
const value = name => { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; };
if (args.some((arg, i) => arg.startsWith('--') && !['--chantier', '--port', '--demo'].includes(arg)) || ['--chantier', '--port'].some(arg => args.includes(arg) && (!value(arg) || value(arg).startsWith('--')))) throw new Error('Usage : npm run dev:review -- [--chantier DOSSIER] [--port 5190] [--demo]');
const demo = args.includes('--demo');
const port = Number(value('--port') || (demo ? 5191 : 5190));
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Port invalide.');
let folder = value('--chantier') || process.env.AVEREO_REVIEW_ROOT;
if (demo) {
  if (value('--chantier')) throw new Error('Le mode démonstration ne peut pas écrire dans un chantier fourni.');
  folder = await mkdtemp(join(tmpdir(), 'avereo-revue-demo-'));
  const { demoState, demoDocument } = await import('./review-fixture.mjs');
  await writeFile(join(folder, 'suivi-chantier.json'), JSON.stringify(demoState(), null, 2));
  await writeFile(join(folder, 'audit-demo.md'), demoDocument);
} else if (!folder) {
  folder = [join(repoRoot, 'docs/chantier-optimisation'), resolve(repoRoot, '../architecture-documentation-avereo/docs/chantier-optimisation')]
    .find(candidate => existsSync(join(candidate, 'suivi-chantier.json')));
}
if (!folder || !existsSync(join(folder, 'suivi-chantier.json'))) throw new Error('Dossier du chantier absent. Fournir --chantier "chemin du dossier contenant suivi-chantier.json".');
process.env.AVEREO_REVIEW_ROOT = resolve(folder);
process.env.AVEREO_REVIEW_DEMO = demo ? '1' : '0';
execFileSync(process.execPath, [join(appRoot, 'workflows/generer-planning-pilote.mjs')], { stdio: 'inherit', windowsHide: true });
execFileSync(process.execPath, [join(repoRoot, '.github/scripts/prepare-connect-gate.mjs'), 'projet'], { stdio: 'inherit', windowsHide: true });
const { createServer } = await import('../frontend/node_modules/vite/dist/node/index.js');
const server = await createServer({ root: join(appRoot, 'frontend'), configFile: join(appRoot, 'frontend/vite.config.js'), server: { host: '127.0.0.1', port, strictPort: true } });
await server.listen();
console.log(`Projet ${demo ? 'DEMONSTRATION' : 'REVUE'} : http://127.0.0.1:${port}/`);
console.log(`Suivi connecté : ${process.env.AVEREO_REVIEW_ROOT}`);
console.log('Les décisions nécessitent une action humaine explicite. Ctrl+C pour arrêter.');
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await server.close(); process.exit(0); });

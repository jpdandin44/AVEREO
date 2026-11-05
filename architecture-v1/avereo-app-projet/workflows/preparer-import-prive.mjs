import { readFile, realpath, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import vm from 'node:vm';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const repository = path.resolve(appRoot, '../..');
const sandbox = { module: { exports: {} }, Date };
vm.runInNewContext(await readFile(path.join(appRoot, 'frontend/public/planning-core.js'), 'utf8'), sandbox);
const P = sandbox.module.exports;
const plain = value => JSON.parse(JSON.stringify(value));
const inside = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

async function privateParent(destination) {
  // Resolve symlinks/junctions before checking boundaries. Parent must already exist.
  const parent = await realpath(path.dirname(path.resolve(destination)));
  if (inside(await realpath(repository), parent)) throw new Error('Destination interdite dans le dépôt.');
  for (let current = parent; ; current = path.dirname(current)) {
    if (['public', 'public_html', 'www', 'dist', 'htdocs'].includes(path.basename(current).toLowerCase())) {
      throw new Error('Destination interdite dans un répertoire public.');
    }
    try {
      await stat(path.join(current, '.git'));
      throw new Error('Destination interdite dans un dépôt Git.');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (path.dirname(current) === current) break;
  }
  return path.join(parent, path.basename(path.resolve(destination)));
}

export async function preparePrivateImport(source, destination) {
  const target = await privateParent(destination);
  if (['public', 'public_html', 'www', 'dist', 'htdocs'].includes(path.basename(target).toLowerCase())) {
    throw new Error('Destination publique interdite.');
  }
  const sourceStat = await stat(source);
  if (!sourceStat.isFile() || sourceStat.size > P.LIMITS.maxProjectBytes) throw new Error('Fichier invalide ou trop volumineux.');
  const bytes = await readFile(source);
  if (bytes.length > P.LIMITS.maxProjectBytes) throw new Error('Fichier trop volumineux.');
  const raw = JSON.parse(bytes.toString('utf8'));
  const normalized = P.decodeProject(bytes.toString('utf8'));
  // Refuse silent changes: caller must resolve obsolete or unsupported fields explicitly.
  if (!isDeepStrictEqual(raw, plain(normalized))) throw new Error('Normalisation avec modification : exporter un JSON complet compatible avant préparation.');
  const scheduled = P.schedule(normalized, normalized.startDate);
  const roundtrip = P.decodeProject(P.encodeProject(normalized));
  if (!isDeepStrictEqual(raw, plain(roundtrip))) throw new Error('Aller-retour JSON non identique.');
  const manifest = {
    schemaVersion: 1,
    purpose: 'private-project-import',
    preparedAt: new Date().toISOString(),
    file: 'planning.json',
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
    taskCount: normalized.tasks.length,
    milestoneCount: normalized.tasks.filter(task => task.duration === 0).length,
    totalDuration: scheduled.totalDuration,
    importMode: 'new-project',
    delivered: false
  };
  // Exclusive creation: an existing package or project is never replaced.
  await mkdir(target, { mode: 0o700 });
  await writeFile(path.join(target, 'planning.json'), bytes, { flag: 'wx', mode: 0o600 });
  await writeFile(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) {
    console.error('Usage : node workflows/preparer-import-prive.mjs SOURCE_JSON DOSSIER_PRIVE_NOUVEAU');
    process.exitCode = 1;
  } else {
    try {
      const result = await preparePrivateImport(process.argv[2], process.argv[3]);
      console.log(JSON.stringify(result, null, 2));
    } catch {
      // Do not leak a private path or content through parser/validation errors in shared logs.
      console.error('Préparation refusée. Vérifier le JSON complet, sa taille et une destination privée neuve hors dépôt.');
      process.exitCode = 1;
    }
  }
}

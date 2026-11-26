import { readdir, readFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const requis = ['index.html', 'sw.js', 'manifest.webmanifest', '.htaccess', 'api/.htaccess', 'api/lib/.htaccess', 'api/health.php', 'connect/entry.php'];

// Empreinte déterministe des noms et octets, indépendamment des dates et du système de fichiers.
export async function validerPaquet(directory, token = '') {
  const files = new Map();
  async function walk(relative = '') {
    for (const name of (await readdir(resolve(directory, relative))).sort()) {
      const path = relative ? `${relative}/${name}` : name;
      const stat = await lstat(resolve(directory, path));
      if (stat.isSymbolicLink()) throw new Error(`Lien interdit : ${path}`);
      if (['local', 'revue'].includes(name.toLowerCase()) || name.toLowerCase().startsWith('.env') ||
          (name.toLowerCase() === 'config.php' && path !== 'api/lib/config.php')) throw new Error(`Chemin interdit : ${path}`);
      if (stat.isDirectory()) await walk(path);
      else if (stat.isFile()) {
        const data = await readFile(resolve(directory, path));
        if (data.includes(Buffer.from('VITE_LOCAL_API_TOKEN')) || (token && data.includes(Buffer.from(token)))) throw new Error(`Jeton local interdit : ${path}`);
        files.set(path, data);
      } else throw new Error(`Type interdit : ${path}`);
    }
  }
  await walk();
  for (const path of requis) if (!files.get(path)?.length) throw new Error(`Fichier obligatoire absent ou vide : ${path}`);
  const hash = createHash('sha256');
  for (const [path, data] of [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    hash.update(`${path}\0${data.length}\0`); hash.update(data);
  }
  return hash.digest('hex');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(await validerPaquet(process.argv[2] || 'frontend/dist', process.env.VITE_LOCAL_API_TOKEN || '')); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

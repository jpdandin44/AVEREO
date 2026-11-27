// Plugin Vite maison (sans dépendance) : écrit dist/sw.js à partir de pwa/sw-modele.js,
// avec la liste exacte des fichiers assets/ de ce build et une version tirée de leurs noms.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export function serviceWorkerSource(nomsFichiers, modele = readFileSync(new URL('./sw-modele.js', import.meta.url), 'utf8')) {
  const fichiers = nomsFichiers.filter((nom) => nom.startsWith('assets/')).map((nom) => `/${nom}`).sort();
  const version = createHash('sha256').update(fichiers.join('\n')).digest('hex').slice(0, 12);
  return modele.replace('__VERSION__', version).replace('__FICHIERS__', JSON.stringify(fichiers));
}

export default function applicationInstallable() {
  return {
    name: 'rapport-application-installable',
    apply: 'build',
    generateBundle(_options, bundle) {
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource(Object.keys(bundle)) });
    },
  };
}

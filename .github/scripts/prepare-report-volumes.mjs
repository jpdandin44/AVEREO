import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const apps=['rapport','passeport-immo'];
const selected=process.argv[2] || 'all';
if (selected!=='all' && !apps.includes(selected)) throw new Error('Application inconnue');
for (const name of ['report-volumes.json','report-volumes.php']) {
  const source=await readFile(resolve(root,'architecture-v1/avereo-platform/shared',name));
  for (const app of apps.filter(app=>selected==='all' || app===selected)) {
    const target=resolve(root,`architecture-v1/avereo-app-${app}/frontend/public/api`,name);
    if (process.argv.includes('--check')) {
      if (!source.equals(await readFile(target))) throw new Error('Copie des volumes différente : '+target);
    } else await writeFile(target,source);
  }
}
console.log('Contrat des volumes : copies API '+(process.argv.includes('--check')?'vérifiées.':'préparées.'));

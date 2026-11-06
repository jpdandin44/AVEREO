import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = await readFile(resolve(root, 'architecture-v1/avereo-platform/shared/account-menu.js'));
assert.deepEqual(await readFile(resolve(root, 'architecture-v1/avereo-app-connect/backend/public/account-menu.js')), source, 'Le portail CONNECT doit embarquer la copie générée exacte.');
const name = process.argv[2];
if (name) {
  const dist = resolve(root, `architecture-v1/avereo-app-${name}/frontend/dist`);
  if (name === 'saisie-unique') {
    const html = await readFile(resolve(dist, 'index.html'), 'utf8');
    assert.match(html, /avereo-account-menu/);
    assert.match(html, /Mes dossiers locaux/);
  } else {
    assert.deepEqual(await readFile(resolve(dist, 'account-menu.js')), source, 'Menu absent ou divergent dans le livrable.');
    assert.match(await readFile(resolve(dist, 'index.html'), 'utf8'), /src="\/account-menu\.js"/);
  }
  if (['coupe','projet'].includes(name)) assert.match(await readFile(resolve(dist, 'legacy-app.html'), 'utf8'), /<avereo-account-menu/);
  if (name === 'rapport') {
    for (const page of ['rga/index.php','rga/carte.php']) assert.match(await readFile(resolve(dist, page), 'utf8'), /<avereo-account-menu/);
    assert.match(await readFile(resolve(dist, 'rga/logout.php'), 'utf8'), /rga_config\(\)/);
  }
}
console.log('Source et livraison Mon espace cohérentes' + (name ? ' : ' + name : '') + '.');

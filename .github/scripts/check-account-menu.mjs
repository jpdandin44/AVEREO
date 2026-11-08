import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { AVEREO_LOGO } from '../../architecture-v1/avereo-platform/shared/report-identity.js';
import { buildMissionScript } from './build-mission-script.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'architecture-v1/avereo-platform/data/account-menu-applications.json')));
const source = await readFile(resolve(root, 'architecture-v1/avereo-platform/shared/account-menu.js'));
const missionScript = await buildMissionScript();
assert.deepEqual(await readFile(resolve(root, 'architecture-v1/avereo-app-connect/backend/public/assets/missions.js')), missionScript, 'Module Missions différent dans CONNECT.');
assert.deepEqual(await readFile(resolve(root, 'architecture-v1/avereo-app-connect/backend/public/account-menu.js')), source, 'Le portail CONNECT doit embarquer la copie générée exacte.');
const logo = Buffer.from(AVEREO_LOGO.split(',')[1], 'base64');
assert.deepEqual(await readFile(resolve(root, 'architecture-v1/avereo-app-connect/backend/public/assets/avereo-logo.png')), logo);
const name = process.argv[2];
if (name) {
  const app = manifest.applications.find(item => item.id === name);
  assert.ok(app, 'Application inconnue : ' + name);
  const dist = resolve(root, `architecture-v1/avereo-app-${name}/frontend/dist`);
  if (name === 'saisie-unique') {
    const html = await readFile(resolve(dist, 'index.html'), 'utf8');
    assert.match(html, /avereo-account-menu/);
    assert.ok(html.includes('name="avereo-shell-logo" content="' + AVEREO_LOGO + '"'), 'Logo absent du fichier autonome.');
    assert.match(html, /Mes dossiers locaux/);
    assert.ok(html.includes(missionScript.toString('utf8').replace(/<\/(script|style)/gi, '<\\/$1')), 'Module Missions absent de Saisie unique hors ligne.');
  } else {
    assert.deepEqual(await readFile(resolve(dist, 'assets/avereo-logo.png')), logo, 'Logo officiel absent ou divergent.');
    assert.deepEqual(await readFile(resolve(dist, 'account-menu.js')), source, 'Menu absent ou divergent dans le livrable.');
    const path = resolve(dist, 'assets/missions.js');
    if (app.capabilities.includes('missions')) assert.deepEqual(await readFile(path), missionScript, 'Module Missions absent ou divergent dans le livrable.');
    else await assert.rejects(access(path), {code: 'ENOENT'}, 'Un outil complémentaire embarque le générateur de missions.');
    assert.match(await readFile(resolve(dist, 'index.html'), 'utf8'), /src="\/account-menu\.js"/);
  }
  if (['coupe','projet'].includes(name)) {
    const editor = await readFile(resolve(dist, 'legacy-app.html'), 'utf8');
    assert.match(editor, /<avereo-account-menu\b/);
    assert.equal(/<avereo-account-menu\b[^>]*\bno-missions\b/.test(editor), !app.capabilities.includes('missions'));
  }
  if (name === 'rapport') {
    for (const page of ['rga/index.php','rga/carte.php']) {
      const html = await readFile(resolve(dist, page), 'utf8');
      assert.match(html, /<avereo-account-menu\b/);
      assert.equal(/<avereo-account-menu\b[^>]*\bno-missions\b/.test(html), !app.moduleCapabilities.rga.includes('missions'));
    }
    assert.match(await readFile(resolve(dist, 'rga/logout.php'), 'utf8'), /rga_config\(\)/);
  }
}
console.log('Source et livraison Mon espace cohérentes' + (name ? ' : ' + name : '') + '.');

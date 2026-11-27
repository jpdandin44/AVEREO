import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { serviceWorkerSource } from '../pwa/plugin.js';

const lire = (chemin) => readFileSync(new URL(chemin, import.meta.url));

test('application installable : manifeste complet et icônes PNG aux tailles annoncées', () => {
  const manifeste = JSON.parse(lire('../public/manifest.webmanifest').toString('utf8'));
  assert.equal(manifeste.name, 'Rapport AVEREO Pro');
  assert.equal(manifeste.display, 'standalone');
  assert.equal(manifeste.start_url, '/');
  assert.equal(manifeste.scope, '/');
  const annonces = manifeste.icons.map((icone) => {
    const png = lire(`../public${icone.src}`);
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], icone.src);
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icone.sizes, icone.src);
    return `${icone.sizes} ${icone.purpose}`;
  });
  for (const attendu of ['192x192 any', '512x512 any', '512x512 maskable']) assert.ok(annonces.includes(attendu), attendu);
  const page = lire('../index.html').toString('utf8');
  assert.match(page, /<link rel="manifest" href="\/manifest.webmanifest" \/>/);
  assert.match(lire('../public/.htaccess').toString('utf8'), /AddType application\/manifest\+json \.webmanifest/);
});

test('service worker : précharge seulement les fichiers assets/ du build, version stable', () => {
  const bundle = ['assets/index-AAAA.js', 'assets/index-BBBB.css', 'index.html', 'assets/reportDocx-CCCC.js'];
  const source = serviceWorkerSource(bundle);
  assert.match(source, /const FICHIERS = \["\/assets\/index-AAAA\.js","\/assets\/index-BBBB\.css","\/assets\/reportDocx-CCCC\.js"\];/);
  assert.doesNotMatch(source, /__VERSION__|__FICHIERS__/);
  assert.equal(serviceWorkerSource([...bundle].reverse()), source);
  assert.notEqual(serviceWorkerSource(['assets/index-DDDD.js']), source);
});

test('service worker : API, sas CONNECT, authentification et RGA ne sont jamais servis depuis le cache', () => {
  const source = serviceWorkerSource([]);
  const exclus = new RegExp(source.match(/const EXCLUS = \/(.+)\/;/)[1]);
  for (const chemin of ['/api/reports.php', '/api', '/connect/entry.php', '/auth/callback/', '/rga/index.php']) assert.ok(exclus.test(chemin), chemin);
  for (const chemin of ['/', '/assets/index-AAAA.js', '/apiculture']) assert.equal(exclus.test(chemin), false, chemin);
  assert.match(source, /if \(requete\.method !== 'GET'\) return;/);
  // La page d'accueil n'est gardée qu'en réponse 200 HTML non redirigée (session valide).
  assert.match(source, /reponse\.ok && !reponse\.redirected && reponse\.type === 'basic' && type\.includes\('text\/html'\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createRgaProjects } from '../../avereo-app-rapport/frontend/public/rga/project-library.js';
const require = createRequire(new URL('../../avereo-app-passeport-immo/frontend/package.json', import.meta.url));
const { JSDOM } = require('jsdom');
const source = readFileSync(new URL('../shared/account-menu.js', import.meta.url), 'utf8');

function rgaWorkspaceFixture(hash = '') {
  const dom = new JSDOM('<button id="rga-projects">Mes projets</button>', {
    url: 'https://rapport-preprod.avereo.fr/rga/carte.php' + hash, runScripts: 'outside-only',
  });
  // JSDOM does not implement native dialog methods; browser acceptance checks the modal.
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  dom.window.createRgaProjects = createRgaProjects;
  const workspace = readFileSync(new URL('../../avereo-app-rapport/frontend/public/rga/workspace.js', import.meta.url), 'utf8');
  dom.window.eval(workspace.replace(/^import .*\n/, '').replace('export function setupRgaProjects', 'function setupRgaProjects')
    + '\nsetupRgaProjects({ getPoint: () => null, openPoint: () => {} });');
  return { dom, dialog: dom.window.document.querySelector('dialog') };
}

test('RGA : le lien du portail ouvre les projets après chargement et peut être réutilisé', () => {
  const { dom, dialog } = rgaWorkspaceFixture('#lat=43.6&lon=1.4');
  const { window } = dom;
  window.localStorage.setItem('rapport-draft', 'brouillon intact');
  for (let attempt = 0; attempt < 2; attempt++) {
    window.history.replaceState(null, '', '#lat=43.6&lon=1.4&projects');
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    assert.equal(dialog.open, true);
    assert.match(dialog.textContent, /Mes projets — RGA/);
    assert.equal(window.location.hash, '#lat=43.6&lon=1.4');
    assert.equal(window.localStorage.getItem('rapport-draft'), 'brouillon intact');
    dialog.querySelector('.close-projects').click();
    assert.equal(dialog.open, false);
  }
  dom.window.close();
});

test('RGA : accès direct conservé et changement de carte sans ouverture des projets', () => {
  const { dom, dialog } = rgaWorkspaceFixture('#lat=43.6&projects');
  assert.equal(dialog.open, true);
  assert.equal(dom.window.location.hash, '#lat=43.6');
  dialog.querySelector('.close-projects').click();
  dom.window.history.replaceState(null, '', '#lat=44&lon=2');
  dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
  assert.equal(dialog.open, false);
  dom.window.close();
});

function fixture({ portal = 'https://connect-preprod.avereo.fr', content = '', attributes = '' } = {}) {
  const dom = new JSDOM(`<meta name="avereo-connect-portal" content="${portal}"><button id="outside">Extérieur</button><avereo-account-menu ${attributes}>${content}</avereo-account-menu>`, { url: 'https://projet-preprod.avereo.fr/', runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.fetch = () => { throw new Error('Le menu ne doit pas appeler une API'); };
  dom.window.eval(source);
  const menu = dom.window.document.querySelector('avereo-account-menu');
  return { dom, menu, root: menu.shadowRoot };
}

test('libellés partagés, nom accessible et état fermé initial', () => {
  const { dom, menu, root } = fixture();
  assert.equal(menu.open, false);
  assert.equal(root.querySelector('.trigger').getAttribute('aria-expanded'), 'false');
  assert.match(root.textContent, /Mon espace/); assert.match(root.textContent, /Compte AVEREO/);
  assert.equal(root.querySelector('nav').getAttribute('aria-label'), 'Menu de Mon espace');
  dom.window.close();
});
test('un clic ouvre puis referme ; Échap rend le focus au déclencheur', () => {
  const { dom, menu, root } = fixture();
  root.querySelector('button').click(); assert.equal(menu.open, true);
  root.querySelector('button').click(); assert.equal(menu.open, false);
  menu.open = true;
  menu.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(menu.open, false); assert.equal(root.activeElement, menu.trigger);
  dom.window.close();
});
test('clic extérieur ferme ; un clic dans le menu conserve le comportement applicatif', () => {
  const { dom, menu } = fixture({ content: '<button slot="items">Mes projets</button>' });
  menu.open = true;
  menu.querySelector('button').dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true, composed: true }));
  assert.equal(menu.open, true);
  dom.window.document.getElementById('outside').dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true, composed: true }));
  assert.equal(menu.open, false);
  let invoked = 0; menu.querySelector('button').addEventListener('click', () => invoked++);
  menu.open = true; menu.querySelector('button').click();
  assert.equal(invoked, 1); assert.equal(menu.open, false);
  dom.window.close();
});
for (const portal of ['https://connect-preprod.avereo.fr', 'https://connect.avereo.fr']) {
  test('liens de compte dans le même environnement : ' + portal, () => {
    const { dom, root } = fixture({ portal });
    assert.equal(root.querySelector('.account').href, portal + '/#profile');
    assert.equal(root.querySelector('.applications').href, portal + '/');
    assert.equal(root.querySelector('.account').target, '_blank');
    assert.equal(root.querySelector('.logout').getAttribute('href'), '/connect/logout.php');
    dom.window.close();
  });
}
for (const portal of ['', 'javascript:alert(1)', 'https://avereo.fr.evil.example', 'https://user@connect.avereo.fr', 'http://connect.avereo.fr']) {
  test('aucune navigation de compte pour un portail absent ou refusé : ' + portal, () => {
    const { dom, root, menu } = fixture({ portal });
    assert.equal(menu.portal, null);
    assert.ok(root.querySelector('.account').hidden && root.querySelector('.logout').hidden);
    assert.equal(root.querySelector('.local').hidden, false);
    dom.window.close();
  });
}
test('le menu RGA conserve sa route de déconnexion propre', () => {
  const { dom, root } = fixture({ attributes: 'logout-path="/rga/logout.php"' });
  assert.equal(root.querySelector('.logout').getAttribute('href'), '/rga/logout.php'); dom.window.close();
});
test('une route de déconnexion externe est refusée', () => {
  const { dom, root } = fixture({ attributes: 'logout-path="//evil.example/logout"' });
  assert.ok(root.querySelector('.logout').hidden); dom.window.close();
});
test('l’action de déconnexion native peut attendre une sauvegarde et refuser la navigation', () => {
  const { dom, menu } = fixture({ content: '<a slot="logout" href="/connect/logout.php">Se déconnecter</a>' });
  let saves = 0;
  menu.querySelector('a').addEventListener('click', event => { event.preventDefault(); saves++; });
  const event = new dom.window.MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
  menu.open = true; menu.querySelector('a').dispatchEvent(event);
  assert.equal(saves, 1); assert.equal(event.defaultPrevented, true); assert.equal(menu.open, false);
  dom.window.close();
});
test('le retrait React nettoie les écouteurs et ferme le menu', () => {
  const { dom, menu } = fixture(); menu.open = true; menu.remove(); assert.equal(menu.open, false);
  dom.window.document.body.append(menu); menu.open = true; assert.equal(menu.open, true); dom.window.close();
});

const fields = [
  { key: 'sort', label: 'Ordre', type: 'select', default: 'recent', options: [{ value: 'recent', label: 'Récent' }, { value: 'name', label: 'Nom' }] },
  { key: 'details', label: 'Détails', type: 'checkbox', default: true },
];
function preferenceFixture() {
  const context = fixture();
  context.menu.setAttribute('preferences-app', 'thermo');
  context.menu.setAttribute('preferences-label', 'Thermo');
  context.menu.setAttribute('preferences-fields', JSON.stringify(fields));
  context.menu.refreshLinks();
  return context;
}
test('préférences propres à une application, valeurs enregistrées et brouillon intact', () => {
  const { dom, menu, root } = preferenceFixture();
  const storage = dom.window.localStorage;
  storage.setItem('draftReport', '{"photos":["image-originale"],"signature":"signature"}');
  storage.setItem('avereo.drone.preferences.v1', '{"sort":"recent","details":true}');
  const beforeDraft = storage.getItem('draftReport'), beforeDrone = storage.getItem('avereo.drone.preferences.v1');
  let changed;
  dom.window.document.addEventListener('avereo-preferences-change', event => { changed = event.detail; });
  menu.open = true; root.querySelector('.preferences').click();
  assert.equal(menu.open, false); assert.equal(menu.settingsDialog.open, true);
  assert.match(root.querySelector('h2').textContent, /Thermo/);
  root.querySelector('[name=sort]').value = 'name'; root.querySelector('[name=details]').checked = false;
  root.querySelector('form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  assert.deepEqual(JSON.parse(storage.getItem('avereo.thermo.preferences.v1')), { sort: 'name', details: false });
  assert.equal(changed.app, 'thermo'); assert.equal(changed.values.sort, 'name');
  assert.equal(menu.settingsDialog.open, false); assert.equal(storage.getItem('draftReport'), beforeDraft);
  assert.equal(storage.getItem('avereo.drone.preferences.v1'), beforeDrone);
  assert.equal(root.querySelector('.account').href, 'https://connect-preprod.avereo.fr/#profile');
  menu.openPreferences(); assert.equal(root.querySelector('[name=sort]').value, 'name');
  dom.window.close();
});
test('annuler conserve les préférences et rend le focus sans événement de changement', () => {
  const { dom, menu, root } = preferenceFixture();
  let changes = 0; menu.addEventListener('avereo-preferences-change', () => changes++);
  menu.openPreferences(); root.querySelector('[name=sort]').value = 'name'; root.querySelector('.settings-cancel').click();
  assert.equal(dom.window.localStorage.getItem('avereo.thermo.preferences.v1'), null);
  assert.equal(changes, 0); assert.equal(root.activeElement, menu.trigger); dom.window.close();
});
test('un stockage plein garde le formulaire ouvert et ne signale pas un succès', () => {
  const { dom, menu, root } = preferenceFixture();
  dom.window.Storage.prototype.setItem = () => { throw new Error('Quota exceeded'); };
  let changed = false; menu.addEventListener('avereo-preferences-change', () => { changed = true; });
  menu.openPreferences(); root.querySelector('form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  assert.equal(menu.settingsDialog.open, true); assert.equal(changed, false);
  assert.match(root.querySelector('[role=alert]').textContent, /pas pu être enregistrées/); dom.window.close();
});
test('valeurs inconnues ou stockage illisible : défauts utilisables sans réécriture', () => {
  const { dom, menu } = preferenceFixture();
  for (const invalid of ['not-json', 'null', '{"sort":"inconnu","details":"false"}']) {
    dom.window.localStorage.setItem('avereo.thermo.preferences.v1', invalid);
    assert.equal(menu.settings.sort, 'recent'); assert.equal(menu.settings.details, true);
    assert.equal(dom.window.localStorage.getItem('avereo.thermo.preferences.v1'), invalid);
  }
  dom.window.close();
});
test('définition absente ou invalide : aucun réglage artificiel', () => {
  const { dom, menu, root } = preferenceFixture();
  for (const schema of ['[]', '[null]', JSON.stringify([fields[0], fields[0]]), '{"key":"bad"}']) {
    menu.setAttribute('preferences-fields', schema); menu.refreshLinks(); menu.openPreferences();
    assert.equal(root.querySelector('.preferences').hidden, true); assert.equal(menu.settingsDialog.open, false);
  }
  dom.window.close();
});
test('chaque application possède son espace de préférences, y compris sur une origine commune', () => {
  const { dom, menu } = preferenceFixture();
  dom.window.localStorage.setItem('avereo.rapport.preferences.v1', '{"sort":"name","details":false}');
  const Menu = dom.window.customElements.get('avereo-account-menu');
  assert.equal(Menu.readSettings('rapport', fields).sort, 'name');
  assert.equal(Menu.readSettings('rga', fields).sort, 'recent');
  assert.equal(menu.settings.sort, 'recent'); dom.window.close();
});

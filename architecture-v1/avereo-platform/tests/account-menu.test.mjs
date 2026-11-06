import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../avereo-app-passeport-immo/frontend/package.json', import.meta.url));
const { JSDOM } = require('jsdom');
const source = readFileSync(new URL('../shared/account-menu.js', import.meta.url), 'utf8');

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

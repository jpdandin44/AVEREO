import test from 'node:test';
import assert from 'node:assert/strict';
import { CLE_IDENTITE, DUREE_IDENTITE_MS, etatSession, erreurReseau, lienReconnexion, lireIdentite, memoriserIdentite, oublierIdentite } from './sessionHorsLigne.js';

function stockage() {
  const valeurs = new Map();
  return { getItem: (k) => (valeurs.has(k) ? valeurs.get(k) : null), setItem: (k, v) => valeurs.set(k, String(v)), removeItem: (k) => valeurs.delete(k), valeurs };
}

const config = { mode: 'connect_gateway', configured: true };
const user = { id: 42, provider: 'avereo_connect', name: 'Conseiller' };

test('session : réseau coupé ou serveur indisponible → hors ligne ; session refusée → expirée', () => {
  assert.equal(etatSession(null), 'ok');
  assert.equal(etatSession(new TypeError('Failed to fetch')), 'horsLigne');
  assert.equal(etatSession(Object.assign(new Error('Réseau indisponible.'), { code: 'network' })), 'horsLigne');
  assert.equal(etatSession(Object.assign(new Error('Erreur API (503).'), { status: 503 })), 'horsLigne');
  assert.equal(etatSession(Object.assign(new Error('Non autorisé'), { status: 401 })), 'expiree');
  assert.equal(etatSession(Object.assign(new Error('Refusé'), { status: 403 })), 'expiree');
  assert.equal(etatSession(Object.assign(new Error('Demande invalide'), { status: 400 })), 'ok');
  assert.equal(erreurReseau(Object.assign(new Error('x'), { status: 404 })), false);
});

test('identité : mémorisée en mode CONNECT, relue, oubliée à la déconnexion', () => {
  const s = stockage();
  assert.equal(memoriserIdentite(s, { config, user }, 1000), true);
  assert.deepEqual(lireIdentite(s, 2000), { config, user });
  oublierIdentite(s);
  assert.equal(s.valeurs.has(CLE_IDENTITE), false);
  assert.equal(lireIdentite(s, 2000), null);
});

test('identité : refusée hors mode CONNECT, sans compte, illisible ou de plus de 30 jours', () => {
  const s = stockage();
  assert.equal(memoriserIdentite(s, { config: { mode: 'drupal_oauth' }, user }), false);
  assert.equal(memoriserIdentite(s, { config, user: {} }), false);
  s.setItem(CLE_IDENTITE, '{pas du json');
  assert.equal(lireIdentite(s), null);
  memoriserIdentite(s, { config, user }, 0);
  assert.equal(lireIdentite(s, DUREE_IDENTITE_MS + 1), null);
  assert.equal(lireIdentite(undefined), null);
  assert.equal(memoriserIdentite({ getItem() {}, setItem() { throw new Error('quota'); } }, { config, user }), false);
});

test('reconnexion : portail CONNECT avec app=rapport, repli sur / si le portail est absent ou non sécurisé', () => {
  assert.equal(lienReconnexion('https://connect-preprod.avereo.fr'), 'https://connect-preprod.avereo.fr/?app=rapport');
  assert.equal(lienReconnexion('http://connect.avereo.localhost'), 'http://connect.avereo.localhost/?app=rapport');
  assert.equal(lienReconnexion('http://exemple.fr'), '/');
  assert.equal(lienReconnexion(''), '/');
  assert.equal(lienReconnexion('javascript:alert(1)'), '/');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIgnMapUrl, locationConfirmed } from './locationMap.js';

test('la carte IGN contient uniquement le point, le zoom et le fond public', () => {
  const url = new URL(buildIgnMapUrl('2.2945', '48.8584'));
  assert.equal(url.origin, 'https://cartes.gouv.fr');
  assert.equal(url.pathname, '/explorer-les-cartes/embed');
  assert.equal(url.searchParams.get('c'), '2.2945,48.8584');
  assert.equal(url.searchParams.get('p'), '2.2945,48.8584');
  assert.equal(url.searchParams.get('z'), '18');
  assert.equal(url.username, '');
});

test('une position invalide ne produit pas de carte', () => {
  for (const [lon, lat] of [[null, null], ['', ''], [' ', 48], [true, 48], [181, 48], [2, -91], ['javascript:alert(1)', 48]]) {
    assert.equal(buildIgnMapUrl(lon, lat), null);
  }
  assert.ok(buildIgnMapUrl(0, 0));
});

test('la confirmation devient caduque si l adresse ou les coordonnees changent', () => {
  const report = { adresse_logement: 'Lieu de test', cadastre: { lon: 2, lat: 48 }, localisation: {
    confirmation: { adresse: 'Lieu de test', lon: 2, lat: 48, date: '2026-09-12T12:00:00Z' },
  } };
  assert.equal(locationConfirmed(report), true);
  assert.equal(locationConfirmed({ ...report, adresse_logement: 'Autre lieu' }), false);
  assert.equal(locationConfirmed({ ...report, cadastre: { lon: 3, lat: 48 } }), false);
  assert.equal(locationConfirmed({ ...report, localisation: {} }), false);
});

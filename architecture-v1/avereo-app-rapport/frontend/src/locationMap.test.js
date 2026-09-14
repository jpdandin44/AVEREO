import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIgnMapUrl, buildIgnTileUrl, locationConfirmed } from './locationMap.js';

test('la carte IGN contient uniquement le point, le zoom et le fond public', () => {
  const url = new URL(buildIgnMapUrl('2.2945', '48.8584'));
  assert.equal(url.origin, 'https://cartes.gouv.fr');
  assert.equal(url.pathname, '/explorer-les-cartes/embed');
  assert.equal(url.searchParams.get('c'), '2.2945,48.8584');
  assert.equal(url.searchParams.get('p'), '2.2945,48.8584');
  assert.equal(url.searchParams.get('z'), '18');
  assert.ok(url.searchParams.get('l').includes('CADASTRALPARCELS.PARCELLAIRE_EXPRESS'));
  assert.equal(url.username, '');
});

test('les trois couches WMTS sont publiques et utilisent la matrice annoncee par IGN', () => {
  const expected = {
    plan: ['GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'image/png'],
    aerial: ['ORTHOIMAGERY.ORTHOPHOTOS', 'image/jpeg'],
    cadastre: ['CADASTRALPARCELS.PARCELLAIRE_EXPRESS', 'image/png'],
  };
  for (const [name, [layer, format]] of Object.entries(expected)) {
    const template = buildIgnTileUrl(name);
    const url = new URL(template.replace('{z}', '18').replace('{y}', '91564').replace('{x}', '129940'));
    assert.equal(url.origin, 'https://data.geopf.fr');
    assert.equal(url.pathname, '/wmts');
    assert.equal(url.searchParams.get('LAYER'), layer);
    assert.equal(url.searchParams.get('FORMAT'), format);
    assert.equal(url.searchParams.get('TILEMATRIXSET'), 'PM_0_19');
    assert.equal(url.searchParams.get('TILEMATRIX'), '18');
    assert.equal(url.searchParams.get('TILEROW'), '91564');
    assert.equal(url.searchParams.get('TILECOL'), '129940');
    assert.equal(url.searchParams.has('key'), false);
    assert.equal(url.username, '');
  }
  assert.equal(buildIgnTileUrl('https://malicious.example'), null);
  assert.equal(buildIgnTileUrl('__proto__'), null);
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { moveVisitPoint } from './visitPoint.js';
import { locationConfirmed } from './locationMap.js';
import { resourceMatchesLocation } from './buildingResources.js';

const report = () => ({ adresse_logement: 'Lieu public de test',
  cadastre: { lon: 2, lat: 48, section: 'AB', numero: '123' },
  localisation: { adresse_trouvee: 'Adresse BAN', confirmation: { adresse: 'Lieu public de test', lon: 2, lat: 48, date: '2026-09-15T10:00:00Z' } },
  urbanisme: { zone: 'UA', description: 'Ancien zonage', pdfUrl: 'https://example.org/plu', context: { results: [] }, notes: 'Note PLU' },
  terrain: { analysis: { min: 12 }, notes: 'Note terrain', facade: 'Entrée', orientation: 'S' },
  risques: { fetchedAt: '2026-09-15', naturels: [{ key: 'old' }] },
  observations: [{ titre: 'Constat', photos: ['photo'] }], ecoute: { motif: 'Besoin' },
  ressources_batiment: { gorenove: { notes: 'Note ressource', consultedOn: '2026-09-15',
    location: { adresse: 'Lieu public de test', lon: 2, lat: 48, date: '2026-09-15T10:00:00Z' } } },
});

test('a moved point clears derived data and confirmation, preserves all field notes and address', () => {
  const before = report();
  const after = moveVisitPoint(before, 2.001, 48.002, '2026-09-15T12:00:00Z');
  assert.equal(after.adresse_logement, before.adresse_logement);
  assert.equal(after.localisation.adresse_trouvee, 'Adresse BAN');
  assert.equal(after.cadastre.lon, 2.001); assert.equal(after.cadastre.lat, 48.002);
  assert.equal(after.cadastre.section, ''); assert.equal(after.urbanisme.context, null);
  assert.equal(after.urbanisme.zone, ''); assert.equal(after.terrain.analysis, null);
  assert.ok(!after.risques.fetchedAt); assert.deepEqual(after.risques.naturels, []);
  assert.equal(after.urbanisme.notes, 'Note PLU'); assert.equal(after.terrain.notes, 'Note terrain');
  assert.equal(after.terrain.orientation, 'S'); assert.equal(after.observations, before.observations);
  assert.equal(after.ecoute, before.ecoute); assert.equal(after.ressources_batiment, before.ressources_batiment);
  assert.equal(locationConfirmed(after), false);
  assert.equal(resourceMatchesLocation(after, after.ressources_batiment.gorenove), false);
  assert.equal(before.cadastre.lon, 2); assert.equal(before.urbanisme.zone, 'UA');
});

test('invalid or unchanged positions leave the original report untouched', () => {
  const before = report();
  for (const [lon, lat, date] of [[null, 48, '2026-09-15'], [181, 48, '2026-09-15'], [2, '', '2026-09-15'], [2, 49, 'bad'], [2, 48, '2026-09-15']]) {
    assert.equal(moveVisitPoint(before, lon, lat, date), before);
  }
});

test('the manual point survives JSON and requires a new location confirmation', () => {
  const moved = JSON.parse(JSON.stringify(moveVisitPoint(report(), 2.001, 48.002, '2026-09-15T12:00:00Z')));
  assert.equal(moved.localisation.point_manuel.lon, moved.cadastre.lon);
  moved.localisation.confirmation = { adresse: moved.adresse_logement, lon: moved.cadastre.lon, lat: moved.cadastre.lat, date: '2026-09-15T12:01:00Z' };
  assert.equal(locationConfirmed(moved), true);
  assert.equal(resourceMatchesLocation(moved, moved.ressources_batiment.gorenove), false);
});

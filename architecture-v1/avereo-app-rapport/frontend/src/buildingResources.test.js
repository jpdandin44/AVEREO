import test from 'node:test';
import assert from 'node:assert/strict';
import { buildingResourcesHtml, confirmBuildingResource, emptyBuildingResources, normalizeBuildingResources, resourceMatchesLocation, safeBuildingResourceUrl } from './buildingResources.js';

const go = 'https://gorenove.fr/fiche-batiment?id=bdnb-bg-EXEMPLE&origin=adresse';
const pro = 'https://www.proreno.fr/documents/fiche-typologie-analyse-du-parc-existant-mi-3-b';
const report = () => ({ adresse_logement: 'Lieu public de test', cadastre: { lon: -1.5, lat: 47.2 },
  localisation: { confirmation: { adresse: 'Lieu public de test', lon: -1.5, lat: 47.2, date: '2026-09-15T10:00:00Z' } },
  ressources_batiment: { ...emptyBuildingResources(), gorenove: { url: go, notes: 'Note conservée' } },
});
const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

test('resource URLs allow only the expected HTTPS hosts and public routes', () => {
  assert.equal(safeBuildingResourceUrl('gorenove', go + '&email=private#secret'), go);
  assert.equal(safeBuildingResourceUrl('proreno', pro), pro);
  const pdf = 'https://media.proreno.fr/storage/media/shares/pdf/00082/FicheTypologie-MI3b.pdf';
  assert.equal(safeBuildingResourceUrl('proreno', `https://www.proreno.fr/pdf?file=${encodeURIComponent(pdf)}&title=Test`), pdf);
  for (const value of ['javascript:alert(1)', 'http://gorenove.fr/fiche-batiment?id=test', '//gorenove.fr/',
    'https://gorenove.fr.attacker.test/fiche-batiment?id=test', 'https://user:secret@gorenove.fr/fiche-batiment?id=test',
    'https://gorenove.fr:8080/fiche-batiment?id=test', 'https://gorenove.fr/login', 'https://gorenove.fr/fiche-batiment?id=a&id=b',
    'https://gorenove.fr/fiche-batiment?id=a\n', 'https://gorenove.fr/fiche-batiment?id=%22%3E', {}, null]) {
    assert.equal(safeBuildingResourceUrl('gorenove', value), '');
  }
  assert.equal(safeBuildingResourceUrl('proreno', 'https://www.proreno.fr/pdf?file=https://evil.test/a.pdf'), '');
  assert.equal(safeBuildingResourceUrl('proreno', 'https://www.proreno.fr/login'), '');
  assert.equal(safeBuildingResourceUrl('unknown', go), '');
});

test('old and malformed resource payloads normalize without losing other report data', () => {
  for (const value of [undefined, null, [], 12, 'text']) assert.deepEqual(normalizeBuildingResources(value), emptyBuildingResources());
  const item = normalizeBuildingResources({ gorenove: { url: {}, notes: 'x'.repeat(9000), consultedOn: '2026-02-30' } }).gorenove;
  assert.equal(item.url, ''); assert.equal(item.notes.length, 8000); assert.equal(item.consultedOn, '');
});

test('confirmation is explicit, dated, tied to the confirmed location and immutable', () => {
  const before = report();
  assert.equal(resourceMatchesLocation(before, before.ressources_batiment.gorenove), false);
  const after = confirmBuildingResource(before, 'gorenove', '2026-09-15');
  assert.equal(resourceMatchesLocation(after, after.ressources_batiment.gorenove), true);
  assert.equal(before.ressources_batiment.gorenove.location, undefined);
  assert.equal(after.ressources_batiment.gorenove.consultedOn, '2026-09-15');
  assert.equal(after.ressources_batiment.gorenove.notes, 'Note conservée');
  assert.equal(confirmBuildingResource(before, 'gorenove', '2026-02-30'), before);
  assert.equal(confirmBuildingResource(before, 'wrong', '2026-09-15'), before);
  const unconfirmed = { ...before, localisation: {} };
  assert.equal(confirmBuildingResource(unconfirmed, 'gorenove', '2026-09-15'), unconfirmed);
});

test('changed address, coordinates, cancelled or renewed location require reattachment without deletion', () => {
  const saved = confirmBuildingResource(report(), 'gorenove', '2026-09-15');
  for (const next of [
    { ...saved, adresse_logement: 'Autre bien' }, { ...saved, cadastre: { lon: 2, lat: 48 } },
    { ...saved, localisation: {} },
    { ...saved, localisation: { confirmation: { ...saved.localisation.confirmation, date: '2026-09-16T10:00:00Z' } } },
  ]) {
    assert.equal(resourceMatchesLocation(next, next.ressources_batiment.gorenove), false);
    assert.equal(next.ressources_batiment.gorenove.notes, 'Note conservée');
  }
  const restored = JSON.parse(JSON.stringify(saved));
  restored.ressources_batiment = normalizeBuildingResources(restored.ressources_batiment);
  assert.equal(resourceMatchesLocation(restored, restored.ressources_batiment.gorenove), true);
});

test('exports preserve notes, dates, links and stale association warnings with escaped content', () => {
  const saved = confirmBuildingResource(report(), 'gorenove', '2026-09-15');
  saved.ressources_batiment.proreno = { url: pro, notes: '<script>alert("test")</script>\nTypologie générale', consultedOn: '2026-09-14' };
  const html = buildingResourcesHtml(saved, escape);
  assert.match(html, /2026-09-15/); assert.match(html, /Note conservée/);
  assert.match(html, /Typologie générale, pas un diagnostic/);
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>'));
  assert.match(html, /Rattachement au bien à vérifier/);
  saved.ressources_batiment.proreno.url = 'javascript:alert(1)';
  assert.ok(!buildingResourcesHtml(saved, escape).includes('javascript:'));
  assert.equal(buildingResourcesHtml({}, escape), '');
});

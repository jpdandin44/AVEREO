// Sauvegarde des dossiers : export, lecture du fichier, import sans remplacement.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../src/lib/store.js';
import { exporterDonnees, FORMAT_SAUVEGARDE, lireSauvegarde, nomFichierSauvegarde } from '../../src/lib/sauvegarde.js';

function stockage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function magasin() {
  const s = createStore({ storage: stockage() });
  s.actions.initialiser();
  return s;
}

test('export : tous les dossiers, dans l’ordre de la liste, avec le format et la version', () => {
  const s = magasin();
  const id2 = s.actions.creerDossier({ type: 'adaptation', nom: 'Second' });
  const texte = s.actions.exporter();
  const d = JSON.parse(texte);
  assert.equal(d.format, FORMAT_SAUVEGARDE);
  assert.equal(d.version, 1);
  assert.deepEqual(d.dossiers.map((x) => x.id), s.getState().donnees.ordre);
  assert.equal(d.dossiers[0].id, id2);
  assert.match(nomFichierSauvegarde(new Date(2026, 10, 6)), /^avereo-uni-sauvegarde-2026-11-06\.json$/);
});

test('import : les dossiers sont ajoutés sous de nouveaux identifiants, sans remplacer ceux présents', () => {
  const source = magasin();
  source.actions.figerDevis(source.getState().donnees.ordre[0]);
  const texte = exporterDonnees(source.getState().donnees);
  const cible = magasin();
  const avant = JSON.parse(JSON.stringify(cible.getState().donnees));
  assert.equal(cible.actions.importer(texte), 1);
  const apres = cible.getState().donnees;
  assert.equal(apres.ordre.length, 2);
  for (const id of avant.ordre) assert.deepEqual(apres.dossiers[id], avant.dossiers[id]);
  const nouveau = apres.dossiers[apres.ordre[0]];
  assert.ok(!avant.ordre.includes(nouveau.id));
  assert.ok(nouveau.plans.factures && nouveau.fige);
  assert.equal(cible.getState().ui.messageSauvegarde.type, 'ok');
});

test('import : un fichier invalide est refusé et rien n’est importé', () => {
  const s = magasin();
  const avant = JSON.stringify(s.getState().donnees);
  for (const texte of ['{pas du json', JSON.stringify({ format: 'autre' }), JSON.stringify({ format: FORMAT_SAUVEGARDE, version: 9, dossiers: [] }),
    JSON.stringify({ format: FORMAT_SAUVEGARDE, version: 1, dossiers: [{ id: 'x', type: 'inconnu' }] })]) {
    assert.equal(s.actions.importer(texte), 0);
    assert.equal(s.getState().ui.messageSauvegarde.type, 'erreur');
    assert.ok(lireSauvegarde(texte).erreur);
  }
  assert.equal(JSON.stringify(s.getState().donnees), avant);
});

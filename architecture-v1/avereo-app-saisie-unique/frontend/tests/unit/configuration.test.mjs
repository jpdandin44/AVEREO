// T12 (intégrité de la configuration), T13 (couverture du catalogue), T14 (couverture des documents),
// T15 (types de dossier), T22 (intitulés des aperçus), T26 (champs de suivi dans l'onglet de leur capture).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHAMPS, CHAMPS_EXCLUS, GROUPES } from '../../src/config/champs.js';
import { DOCUMENTS, champsDuDocument } from '../../src/config/documents.js';
import { LISTES } from '../../src/config/listes.js';
import { champApplicable } from '../../src/lib/modele.js';
import { champsUtilises, requisDuDocument } from '../../src/lib/documents.js';

const ici = (p) => fileURLToPath(new URL(p, import.meta.url));
const IDS = new Set(CHAMPS.map((c) => c.id));
const ONGLET = { Administratif: 'administratif', Projet: 'projet', Financement: 'financement', Énergie: 'energie', Travaux: 'travaux', 'hors dossier (paramètres)': 'parametres' };

// Lecture du tableau du catalogue de la phase 0 (docs/00-catalogue-champs.md).
function catalogue() {
  const md = readFileSync(ici('../../../docs/00-catalogue-champs.md'), 'utf-8');
  return md.split('\n').filter((l) => /^\| `[a-z0-9_]+` \|/.test(l)).map((l) => {
    const c = l.split(' | ').map((x) => x.replace(/^\| /, '').replace(/ \|$/, '').trim());
    return { id: c[0].replace(/`/g, ''), onglet: ONGLET[c[2]], documents: c[6] === '—' ? [] : c[6].split(',').map((x) => x.trim()), requis: c[7] === '—' ? [] : c[7].split(',').map((x) => x.trim()), sensible: c[8], statut: c[9] };
  });
}

test('T12 — identifiants uniques, en ASCII minuscule, jamais déduits du libellé', () => {
  assert.equal(IDS.size, CHAMPS.length);
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  for (const c of CHAMPS) {
    assert.match(c.id, /^[a-z][a-z0-9_]*$/, c.id);
    assert.notEqual(c.id, slug(c.libelle), `${c.id} reprend son libellé`);
  }
});

test('T12 — la liste des identifiants est figée (instantané)', () => {
  const instantane = JSON.parse(readFileSync(ici('./identifiants.instantane.json'), 'utf-8'));
  assert.deepEqual([...IDS].sort(), [...instantane].sort());
});

test('T12 — chaque champ porte l’indicateur « sensible », un onglet et un groupe connus', () => {
  const groupes = new Set(GROUPES.map((g) => `${g.onglet}/${g.id}`));
  for (const c of CHAMPS) {
    assert.equal(typeof c.sensible, 'boolean', c.id);
    assert.ok(groupes.has(`${c.onglet}/${c.groupe}`), c.id);
  }
  // Champs sensibles imposés par le prompt : santé et situation, revenus, naissance, observations libres.
  for (const id of ['dos_niveau_apa', 'foy_invalidite80', 'foy_rfr', 'prop_naissance', 'dos_observations']) {
    assert.equal(CHAMPS.find((c) => c.id === id).sensible, true, id);
  }
});

test('T12 — chaque champ utilisé ou requis par un document existe', () => {
  for (const d of DOCUMENTS) {
    for (const id of champsDuDocument(d)) assert.ok(IDS.has(id), `${d.id} : ${id}`);
    for (const id of requisDuDocument(d)) assert.ok(IDS.has(id), `${d.id} requiert ${id}`);
  }
});

test('T12 — chaque liste de choix est rattachée à un champ à liste', () => {
  for (const id of Object.keys(LISTES)) assert.ok(IDS.has(id), id);
  for (const c of CHAMPS.filter((x) => ['choix', 'liste', 'cases'].includes(x.saisie))) assert.ok(LISTES[c.id], `liste absente : ${c.id}`);
});

test('T13 — chaque champ du catalogue est dans la configuration, dans l’onglet du catalogue', () => {
  const lignes = catalogue();
  assert.equal(lignes.length, 251);
  for (const l of lignes) {
    if (CHAMPS_EXCLUS[l.id]) {
      assert.equal(l.statut, 'à confirmer', `${l.id} exclu alors qu’il n’est pas « à confirmer »`);
      continue;
    }
    const c = CHAMPS.find((x) => x.id === l.id);
    assert.ok(c, `absent : ${l.id}`);
    assert.equal(c.onglet, l.onglet, `onglet de ${l.id}`);
    assert.equal(c.sensible, l.sensible === 'oui', `sensible de ${l.id}`);
  }
});

test('T14 — chaque document traité place les champs que le catalogue lui attribue, et ses champs requis existent', () => {
  const lignes = catalogue();
  for (const d of DOCUMENTS) {
    const utilises = champsUtilises(d);
    for (const l of lignes.filter((x) => x.documents.includes(d.id) && !CHAMPS_EXCLUS[x.id])) {
      assert.ok(utilises.has(l.id), `${d.id} ne place pas ${l.id}`);
    }
    for (const l of lignes.filter((x) => x.requis.includes(d.id))) assert.ok(requisDuDocument(d).includes(l.id), `${d.id} : ${l.id} requis`);
  }
});

test('T15 — les champs d’un type sont ceux que le catalogue lui attribue ; les trois types partagent le plan de financement', () => {
  const ene = CHAMPS.filter((c) => c.types === 'energie');
  const ada = CHAMPS.filter((c) => c.types === 'adaptation');
  assert.ok(ene.length > 0 && ada.length > 0);
  for (const c of ene) {
    assert.ok(champApplicable(c, 'energie'));
    assert.ok(!champApplicable(c, 'adaptation') && !champApplicable(c, 'insalubrite'), c.id);
  }
  for (const c of ada) {
    assert.ok(champApplicable(c, 'adaptation') && champApplicable(c, 'insalubrite'));
    assert.ok(!champApplicable(c, 'energie'), c.id);
  }
  const plan = CHAMPS.filter((c) => c.onglet === 'financement' && c.types === 'tous');
  for (const t of ['energie', 'adaptation', 'insalubrite']) assert.ok(plan.every((c) => champApplicable(c, t)));
});

test('T22 — chaque aperçu cite son imprimé et donne un intitulé à chaque valeur', () => {
  for (const d of DOCUMENTS) {
    assert.ok(d.reference && d.titre, d.id);
    for (const s of [...d.sections, ...(d.signature ? [d.signature] : [])]) {
      for (const it of s.items) {
        if (it.c || it.calc || it.compose || it.adresse) assert.ok(it.l, `${d.id} : intitulé manquant (${it.c || it.calc})`);
        if (it.table) it.colonnes.forEach((col) => assert.ok(col.l, `${d.id} : colonne sans intitulé`));
      }
    }
  }
});

test('T26 — les champs de suivi sont dans l’onglet de leur capture ; un programme est une simple liste de choix', () => {
  const attendu = { dos_statut: 'administratif', dos_alarme: 'administratif', dos_abandon_cause: 'administratif', dos_programme: 'administratif',
    dos_origine_contact: 'administratif', dos_observations: 'administratif', dos_annee: 'projet', dos_type_projet: 'projet', dos_date_depot: 'projet', dos_relance: 'projet' };
  for (const [id, onglet] of Object.entries(attendu)) assert.equal(CHAMPS.find((c) => c.id === id).onglet, onglet, id);
  assert.equal(CHAMPS.find((c) => c.id === 'dos_programme').saisie, 'liste');
});

test('le champ d’identifiant et de mot de passe n’est pas repris (Q30)', () => {
  assert.ok(!IDS.has('etp_acces_compte'));
});

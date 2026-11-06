// T03 à T05 (scénario), T07 (signalements), T08 (journal), T16 (suivi et « Figer au dépôt »), T17 (devis figé),
// T18 (persistance), et documents concernés par une modification.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, CLE_STOCKAGE } from '../../src/lib/store.js';
import { calculerDossier, calculerPlan } from '../../src/lib/calculs.js';
import { DOCUMENTS } from '../../src/config/documents.js';
import { documentsConcernes, signalements, statutDocument } from '../../src/lib/documents.js';
import { progression } from '../../src/lib/progression.js';
import { num } from '../../src/lib/nombres.js';

function stockage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}

function avecExemple(opts = {}) {
  const s = createStore({ storage: stockage(), ...opts });
  s.actions.initialiser();
  const id = s.getState().donnees.ordre[0];
  return { s, id, d: () => s.getState().donnees.dossiers[id] };
}

const doc = (id) => DOCUMENTS.find((x) => x.id === id);
const statut = (d, id, plan = 'devis') => statutDocument(signalements(d, doc(id), plan, calculerDossier(d)));

test('premier lancement : le dossier d’exemple est créé', () => {
  const { d } = avecExemple();
  assert.equal(d().exemple, true);
  assert.equal(d().plans.devis.postes.length, 3);
});

test('T03 et T04 — changement d’avis puis retour au choix initial, notés au journal', () => {
  const { s, id, d } = avecExemple();
  s.actions.changementAvis(id);
  assert.equal(d().plans.devis.postes[1].valeurs.pst_intitule, 'Remplacement des fenêtres (variante bois)');
  assert.equal(calculerPlan(d().plans.devis).valeurs.fin_travaux_ht, 13700);
  assert.equal(num(d().valeurs.ava_montant), 3000);
  assert.equal(d().journal[0].titre, 'Changement d’avis du propriétaire');
  s.actions.changementAvis(id);
  assert.equal(d().journal[0].titre, 'Retour au choix initial');
  assert.equal(calculerPlan(d().plans.devis).valeurs.fin_travaux_ht, 12400);
  assert.equal(d().plans.devis.postes[1].valeurs.pst_intitule, 'Remplacement des fenêtres');
});

test('T03 — le changement d’avis met à jour les documents qui utilisent les postes, pas les autres', () => {
  const { s, id } = avecExemple();
  s.actions.changementAvis(id);
  const concernes = documentsConcernes(s.getState().ui.derniere[id]).map((x) => x.id);
  for (const x of ['PF', 'ATD', 'AVA', 'ACO', 'SYN']) assert.ok(concernes.includes(x), x);
  for (const x of ['CEE', 'EXC', 'PRS', 'PRP']) assert.ok(!concernes.includes(x), x);
});

test('T05 — poste 2 supprimé : le scénario le recrée en deuxième position', () => {
  const { s, id, d } = avecExemple();
  s.actions.supprimerLigne(id, 'poste', 'devis', 2);
  assert.equal(d().plans.devis.postes.length, 2);
  s.actions.changementAvis(id);
  assert.equal(d().plans.devis.postes.length, 3);
  assert.equal(d().plans.devis.postes[1].id, 2);
  assert.equal(d().plans.devis.postes[1].valeurs.pst_ht, '8100');
});

test('T07 — surface et observations effacées : « 2 à compléter » sur la synthèse ; les autres documents de la maquette restent complets', () => {
  const { s, id, d } = avecExemple();
  assert.equal(statut(d(), 'SYN'), '✓ Complet');
  s.actions.saisir(id, 'log_surface', '');
  s.actions.saisir(id, 'dos_observations', '');
  assert.equal(statut(d(), 'SYN'), '2 à compléter');
  for (const x of ['PF', 'ATD', 'AVA']) assert.equal(statut(d(), x), '✓ Complet', x);
  assert.equal(statut(d(), 'ATF'), 'Disponible après « Figer au dépôt »');
});

test('T08 — frappes successives dans un même champ à moins de 2 500 ms : une seule entrée ; douze entrées affichées', () => {
  let t = 1_000_000;
  const { s, id, d } = avecExemple({ horloge: () => t });
  s.actions.saisir(id, 'prop_nom', 'A');
  t += 1000;
  s.actions.saisir(id, 'prop_nom', 'AB');
  assert.equal(d().journal.length, 1);
  assert.equal(d().journal[0].items[0].vers, 'AB');
  t += 3000;
  s.actions.saisir(id, 'prop_nom', 'ABC');
  assert.equal(d().journal.length, 2);
  // Les champs de suivi figurent au journal.
  s.actions.saisir(id, 'dos_statut', 'Relance');
  assert.equal(d().journal[0].items[0].champ, 'dos_statut');
  for (let i = 0; i < 20; i += 1) { t += 3000; s.actions.saisir(id, 'dos_details', `x${i}`); }
  assert.ok(d().journal.length > 12);
});

test('T16 — un champ de suivi ne change ni la progression d’un onglet ni les signalements', () => {
  const { s, id, d } = avecExemple();
  const avant = progression(d(), 'administratif');
  const sig = statut(d(), 'PF');
  s.actions.saisir(id, 'dos_statut', 'Relance');
  s.actions.saisir(id, 'dos_alarme', 'oui');
  s.actions.saisir(id, 'dos_programme', 'Programme A');
  assert.deepEqual(progression(d(), 'administratif'), avant);
  assert.equal(statut(d(), 'PF'), sig);
});

test('T16 — « Figer au dépôt » fige le plan Devis sans rien imposer sur le statut ni la date de dépôt', () => {
  const { s, id, d } = avecExemple();
  s.actions.figerDevis(id);
  assert.ok(d().fige && d().fige.date);
  assert.ok(d().plans.factures);
  assert.equal(d().valeurs.dos_statut, 'En cours');
  assert.equal(d().valeurs.dos_date_depot, undefined);
  assert.ok(s.getState().ui.suggestionDepot);
  s.actions.appliquerSuggestionDepot(id, { date: '2026-11-03', statut: true });
  assert.equal(d().valeurs.dos_date_depot, '2026-11-03');
  assert.equal(d().valeurs.dos_statut, 'Déposer');
});

test('T17 — devis figé : modifier la facture ne change pas le devis ; l’écart est recalculé ; le devis n’est plus modifiable', () => {
  const { s, id, d } = avecExemple();
  s.actions.figerDevis(id);
  s.actions.saisir(id, 'pst_ht', '7000', { niveau: 'poste', planId: 'factures', ligneId: 2 });
  assert.equal(d().plans.devis.postes[1].valeurs.pst_ht, '6800');
  assert.equal(calculerDossier(d()).valeurs.fin_ecart_ht, 200);
  s.actions.saisir(id, 'pst_ht', '1', { niveau: 'poste', planId: 'devis', ligneId: 2 });
  s.actions.saisir(id, 'fin_apport', '1', { planId: 'devis' });
  assert.equal(d().plans.devis.postes[1].valeurs.pst_ht, '6800');
  assert.equal(d().plans.devis.valeurs.fin_apport, '2000');
  assert.equal(statut(d(), 'ATF', 'factures'), '✓ Complet');
});

test('T18 — après rechargement, le dossier est identique', () => {
  const st = stockage();
  const s1 = createStore({ storage: st });
  s1.actions.initialiser();
  const id = s1.getState().donnees.ordre[0];
  s1.actions.saisir(id, 'prop_prenom', 'Camille');
  s1.actions.figerDevis(id);
  const avant = s1.getState().donnees;
  const s2 = createStore({ storage: st });
  s2.actions.initialiser();
  assert.deepEqual(s2.getState().donnees, avant);
  assert.ok(st.getItem(CLE_STOCKAGE));
});

test('données illisibles : mises de côté, l’outil repart d’un état vide et le signale', () => {
  const st = stockage();
  st.setItem(CLE_STOCKAGE, '{abc');
  const s = createStore({ storage: st });
  assert.ok(s.getState().ui.erreurStockage);
  assert.equal(st.getItem(`${CLE_STOCKAGE}.illisible`), '{abc');
});

test('liste des dossiers : création, filtre par statut, suppression', () => {
  const { s } = avecExemple();
  const id2 = s.actions.creerDossier({ type: 'adaptation', nom: 'Second' });
  s.actions.saisir(id2, 'dos_statut', 'Relance');
  const ds = Object.values(s.getState().donnees.dossiers);
  assert.equal(ds.filter((x) => x.valeurs.dos_statut === 'Relance').length, 1);
  s.actions.supprimer(id2);
  assert.equal(s.getState().donnees.ordre.length, 1);
});

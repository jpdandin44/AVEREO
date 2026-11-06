// T01, T02, T03, T06 (équilibre), T09 et T17 (écarts), T10 et T25 (ratios), T11 (feuille PLAN FINAL), T19 (montants),
// T24 (totaux HT et TTC issus des postes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculerDossier, calculerPlan, ecarts } from '../../src/lib/calculs.js';
import { calculerRatios } from '../../src/lib/ratios.js';
import { RATIOS } from '../../src/config/ratios.js';
import { dossierExemple, VARIANTE } from '../../src/lib/exemple.js';
import { copie, nouveauDossier, planVide } from '../../src/lib/modele.js';
import { lireNombre, num, eur } from '../../src/lib/nombres.js';

const espaces = (s) => s.replace(/[  ]/g, ' ');

test('T01 — postes de départ et total des travaux de 12 400 €', () => {
  const d = dossierExemple('d1');
  assert.deepEqual(d.plans.devis.postes.map((p) => [p.valeurs.pst_intitule, num(p.valeurs.pst_ht)]),
    [['Isolation des combles', 3200], ['Remplacement des fenêtres', 6800], ['Ventilation mécanique', 2400]]);
  assert.equal(calculerPlan(d.plans.devis).valeurs.fin_travaux_ht, 12400);
});

test('T02 — financement de départ équilibré : 2 000 + 4 500 + 5 900 = 12 400 €', () => {
  const c = calculerPlan(dossierExemple('d1').plans.devis);
  assert.equal(c.valeurs.fin_apport ?? num(dossierExemple('d1').plans.devis.valeurs.fin_apport), 2000);
  assert.equal(c.valeurs.fin_aides, 4500);
  assert.equal(c.valeurs.fin_pret, 5900);
  assert.equal(c.valeurs.fin_total_ressources, 12400);
  assert.equal(c.equilibre.message, '✓ Plan équilibré : le total financé couvre le coût des travaux.');
  assert.equal(num(dossierExemple('d1').valeurs.ava_montant), 3000);
});

test('T03 — changement d’avis : 8 100 €, total 13 700 €, reste à financer 1 300 €', () => {
  const d = dossierExemple('d1');
  Object.assign(d.plans.devis.postes[1].valeurs, VARIANTE);
  const c = calculerPlan(d.plans.devis);
  assert.equal(c.valeurs.fin_travaux_ht, 13700);
  assert.equal(espaces(c.equilibre.message), '! Reste à financer : 1 300 €.');
  assert.equal(num(d.valeurs.ava_montant), 3000);
});

test('T06 — autres messages d’équilibre', () => {
  const d = dossierExemple('d1');
  d.plans.devis.valeurs.fin_apport = '2500';
  assert.equal(espaces(calculerPlan(d.plans.devis).equilibre.message), '! Le financement dépasse le coût des travaux de 500 €.');
  d.plans.devis.postes = [];
  assert.equal(calculerPlan(d.plans.devis).equilibre.message, '! Aucun poste chiffré : le plan ne peut pas être équilibré.');
});

test('T11 — formules de la feuille PLAN FINAL : solde de 0 € au départ, de 1 300 € après le changement d’avis', () => {
  const d = dossierExemple('d1');
  let c = calculerPlan(d.plans.devis);
  // total des subventions = aide de l'Anah + autres primes ; reste à charge = coût des travaux − total des subventions
  assert.equal(c.valeurs.fin_aides, 4500);
  assert.equal(c.valeurs.fin_reste_charge, 12400 - 4500);
  // solde du projet = reste à charge − (éco-PTZ + autre prêt + apport personnel)
  assert.equal(c.valeurs.fin_solde_projet, 0);
  d.plans.devis.valeurs.fin_autres_primes = '0';
  Object.assign(d.plans.devis.postes[1].valeurs, VARIANTE);
  c = calculerPlan(d.plans.devis);
  assert.equal(c.valeurs.fin_solde_projet, 1300);
});

test('T09 et T17 — écart devis-factures par poste et au total ; la facture ne modifie pas le devis', () => {
  const d = nouveauDossier({ id: 'd2' });
  d.plans.devis.postes = [{ id: 1, valeurs: { pst_intitule: 'Poste', pst_ht: '300', pst_ttc: '316,50' } }];
  d.plans.factures = copie(d.plans.devis);
  d.plans.factures.postes[0].valeurs.pst_ht = '400';
  const e = ecarts(d);
  assert.equal(e.lignes[0].pst_ecart_ht, 100);
  assert.equal(e.fin_ecart_ht, 100);
  assert.equal(d.plans.devis.postes[0].valeurs.pst_ht, '300');
  assert.equal(calculerDossier(d).valeurs.fin_ecart_ht, 100);
});

test('T10 — ratios : 50 € et 75 € HT au m² donnent une moyenne simple de 62,50 € ; un poste sans surface est compté à part', () => {
  const d1 = nouveauDossier({ id: 'a' });
  d1.plans.devis.postes = [
    { id: 1, valeurs: { pst_travail: 'Isolation', pst_ht: '1000', pst_surface: '20' } },
    { id: 2, valeurs: { pst_travail: 'Isolation', pst_ht: '500' } },
  ];
  const d2 = nouveauDossier({ id: 'b' });
  d2.plans.devis.postes = [{ id: 1, valeurs: { pst_travail: 'Isolation', pst_ht: '3000', pst_surface: '40' } }];
  const r = calculerRatios([d1, d2]).travail.find((g) => g.cle === 'Isolation');
  assert.equal(r.moyennes.ht.valeur, 62.5);
  assert.equal(r.moyennes.ht.retenus, 2);
  assert.equal(r.sansSurface, 1);
  assert.equal(r.postes, 3);
});

test('T10 — les ratios lisent les factures quand le plan Devis est figé', () => {
  const d = nouveauDossier({ id: 'a' });
  d.plans.devis.postes = [{ id: 1, valeurs: { pst_travail: 'X', pst_ht: '1000', pst_surface: '10' } }];
  d.plans.factures = copie(d.plans.devis);
  d.plans.factures.postes[0].valeurs.pst_ht = '2000';
  assert.equal(calculerRatios([d]).travail[0].moyennes.ht.valeur, 200);
});

test('T25 — la formule est portée par la configuration', () => {
  const d = nouveauDossier({ id: 'a' });
  d.plans.devis.postes = [{ id: 1, valeurs: { pst_travail: 'X', pst_ht: '1000', pst_ttc: '1100', pst_surface: '10' } }];
  const base = calculerRatios([d]);
  assert.equal(base.travail[0].moyennes.ht.valeur, 100);
  const autre = calculerRatios([d], { ...RATIOS, mesures: [{ id: 'ht', champ: 'pst_ttc', libelle: 'x' }] });
  assert.equal(autre.travail[0].moyennes.ht.valeur, 110);
});

test('T19 — montants saisis avec virgule et espaces, arrondis au centime', () => {
  assert.equal(lireNombre('3 200,50'), 3200.5);
  assert.equal(lireNombre('3 200,5 €'), 3200.5);
  assert.equal(lireNombre('abc'), null);
  const p = planVide();
  p.postes = [{ id: 1, valeurs: { pst_ht: '0,1' } }, { id: 2, valeurs: { pst_ht: '0,2' } }];
  assert.equal(calculerPlan(p).valeurs.fin_travaux_ht, 0.3);
  assert.equal(espaces(eur(1234.567)), '1 234,57 €');
});

test('T24 — totaux HT et TTC du plan de financement issus des postes de l’onglet Travaux', () => {
  const c = calculerPlan(dossierExemple('d1').plans.devis);
  assert.equal(c.valeurs.fin_travaux_ht, 12400);
  assert.equal(c.valeurs.fin_travaux_ttc, 3376 + 7174 + 2532);
});

test('base de l’équilibre en TTC (paramètre)', () => {
  const c = calculerPlan(dossierExemple('d1').plans.devis, { baseEquilibre: 'ttc' });
  assert.equal(c.valeurs.fin_solde_projet, 13082 - 12400);
});

test('gains de classes et SIREN déduit du SIRET', () => {
  const d = dossierExemple('d1');
  d.plans.devis.valeurs.ene_classe_apres = '111 à 180 C';
  assert.equal(calculerPlan(d.plans.devis).valeurs.ene_gain_classes, 2);
  d.valeurs.ent_siret = '123 456 789 00012';
  assert.equal(calculerDossier(d).valeurs.ent_siren, '123456789');
});

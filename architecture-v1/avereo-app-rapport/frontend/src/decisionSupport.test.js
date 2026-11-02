import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDecision, hasDecisionData, decisionWarnings, decisionComparison, buildDecisionHtml } from './decisionSupport.js';

function dossier() {
  const decision = normalizeDecision();
  decision.habitants.non_negociables = 'Une chambre disponible';
  decision.projet.budget = 'Non communiqué';
  decision.attentes = [{ id: 'w1', libelle: 'Confort de chambre', priorite: 'À discuter', source: 'Entretien' }];
  decision.liens = [{ id: 'l1', observation_id: 'o1', attente_ids: ['w1'], effet: 'Usage de la chambre perturbé', verification: 'Cause à vérifier' }];
  decision.actions = [{ id: 'a1', intitule: 'Vérifier le parcours d’air', categorie: 'Préventif', priorite: 'Avant choix',
    incontournable: true, observation_ids: ['o1'], attente_ids: ['w1'], prealables: 'Accès à convenir', horizon: 'Avant travaux', explication: 'Principe général' }];
  for (const key of ['option_a', 'option_b']) { decision[key].objectif = 'Améliorer le confort'; decision[key].action_ids = ['a1']; }
  return { categorie: 'Visite Globale', observations: [{ id: 'o1', titre: 'Traces au mur' }], decision };
}

test('legacy or untouched reports acquire no invented decision content', () => {
  assert.equal(hasDecisionData({}), false); assert.equal(buildDecisionHtml({}), '');
  assert.equal(buildDecisionHtml({ decision: normalizeDecision() }), '');
  assert.deepEqual(decisionWarnings({}), []);
});
test('both options use exactly the same criteria and unknowns are explicit', () => {
  const report = dossier(); report.decision.option_a.criteres.budget = 'À chiffrer après visite';
  const comparison = decisionComparison(report);
  assert.equal(comparison.length, 9);
  assert.deepEqual(comparison.find(r => r.key === 'budget'), {key:'budget', label:'Budget', a:'À chiffrer après visite', b:'À évaluer'});
  assert.ok(comparison.every(r => typeof r.a === 'string' && typeof r.b === 'string'));
});
test('linked reasoning and manual constraints survive JSON and rendering without mutation', () => {
  const report = dossier(), before = JSON.stringify(report);
  const loaded = JSON.parse(before), html = buildDecisionHtml(loaded);
  for (const text of ['Confort de chambre', 'Traces au mur', 'Usage de la chambre perturbé', 'Vérifier le parcours d’air', 'Une chambre disponible', 'Non communiqué']) assert.ok(html.includes(text));
  assert.equal(JSON.stringify(loaded), before); assert.deepEqual(decisionWarnings(loaded), []);
});
test('deleting a referenced item exposes the broken link and preserves its identifier', () => {
  const report = dossier(); report.observations = [];
  assert.match(decisionWarnings(report).join('\n'), /introuvable.*o1/);
  assert.match(buildDecisionHtml(report), /Référence introuvable \(o1\)/);
  assert.equal(report.decision.liens[0].observation_id, 'o1');
});
test('duplicate IDs are signalled rather than resolved to an arbitrary item', () => {
  const report = dossier(); report.decision.attentes.push({...report.decision.attentes[0], libelle:'Autre attente'});
  assert.match(decisionWarnings(report).join('\n'), /dupliqué/); assert.match(buildDecisionHtml(report), /ambiguë/);
});
test('an omitted mandatory action and missing budget stay visible without ranking options', () => {
  const report = dossier(); report.decision.projet.budget = ''; report.decision.option_b.action_ids = [];
  const warnings = decisionWarnings(report).join('\n');
  assert.match(warnings, /incontournable.*omise/); assert.match(warnings, /Budget.*non renseigné/);
  assert.equal(report.decision.arbitrage.option_proposee, '');
});
test('all professional text and imported labels are escaped in HTML', () => {
  const report = dossier(); report.decision.option_a.nom = '<img src=x onerror=alert(1)>';
  report.decision.attentes[0].libelle = '<script>alert(1)</script>';
  const html = buildDecisionHtml(report);
  assert.doesNotMatch(html, /<script>|<img src=x/); assert.match(html, /&lt;script&gt;/); assert.match(html, /&lt;img/);
});
test('client export includes comparison but keeps detailed interview sources in expert report', () => {
  const report = dossier(); report.decision.attentes[0].source = 'Note experte de provenance';
  const html = buildDecisionHtml(report, true);
  assert.match(html, /Comparaison des conséquences/); assert.match(html, /Confort de chambre/);
  assert.doesNotMatch(html, /Note experte de provenance|Usage de la chambre perturbé/);
  assert.match(html, /Aucune option retenue/);
});
test('technical reports retain decision data in JSON without exporting the interview', () => {
  const report = dossier(); report.categorie = 'Expertise & Visite technique';
  assert.equal(buildDecisionHtml(report), ''); assert.equal(report.decision.attentes.length, 1);
});
test('future schemas are identified without silently downgrading stored data', () => {
  const report = dossier(); report.decision.schema_version = 2;
  assert.equal(normalizeDecision(report.decision).schema_version, 2);
  assert.match(buildDecisionHtml(report), /Format non pris en charge/);
  assert.match(decisionWarnings(report).join('\n'), /non pris en charge/);
});

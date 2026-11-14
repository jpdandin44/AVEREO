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

test('decision warnings and the complete limits stay in the same closing block in both deliveries', () => {
  for (const client of [false, true]) {
    const report = dossier();
    report.decision.projet.budget = '';
    const html = buildDecisionHtml(report, client);
    const closing = html.match(/<div class="decision-conclusion keep-together">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(closing);
    assert.match(closing, /Points restant à compléter/);
    for (const warning of decisionWarnings(report)) assert.ok(closing.includes(warning));
    assert.match(closing, /Les conséquences sont rédigées sous hypothèses/);
    assert.match(closing, /ne sont pas calculés par ce module/);
  }
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

const habitologue = () => ({ ...dossier(), profil_metier: 'habitologue', categorie: 'Visite Globale' });
const projectionTexts = ['Vérifier le parcours d’air', 'Principe général', 'Accès à convenir', 'Avant travaux', 'Améliorer le confort', 'Comparaison des conséquences',
  'Arbitrage à discuter', 'Projection 1', 'Projection 2', 'Option A', 'Option B', 'Aucune option retenue'];

test('Habitologue exports sections 1 to 3 and none of the projections, in both deliverables', () => {
  const report = habitologue(); report.decision.arbitrage = { option_proposee: 'a', motif: 'Motif d’arbitrage', prochaine_etape: 'Étape secrète' };
  report.decision.option_a.criteres.budget = 'Critère caché';
  for (const client of [false, true]) {
    const html = buildDecisionHtml(report, client);
    for (const text of ['Confort de chambre', 'Aide à la décision']) assert.ok(html.includes(text));
    for (const text of [...projectionTexts, 'Motif d’arbitrage', 'Étape secrète', 'Critère caché']) assert.ok(!html.includes(text), text);
    assert.equal((html.match(/<section/g) || []).length, (html.match(/<\/section>/g) || []).length);
  }
  const expert = buildDecisionHtml(report);
  for (const text of ['Cadre permanent des habitants', 'Une chambre disponible', 'Du constat à son effet', 'Usage de la chambre perturbé', 'Traces au mur', 'Non communiqué']) assert.ok(expert.includes(text), text);
  assert.doesNotMatch(buildDecisionHtml(report, true), /Usage de la chambre perturbé|Note experte/);
});

test('the Habitologue profile never alters the stored decision data and leaves other profiles untouched', () => {
  const report = habitologue(), before = JSON.stringify(report);
  buildDecisionHtml(report); decisionWarnings(report); hasDecisionData(report);
  assert.equal(JSON.stringify(report), before);
  assert.equal(report.decision.actions.length, 1); assert.deepEqual(report.decision.option_a.action_ids, ['a1']);
  for (const profil of [undefined, '', 'architecte', 'inconnu']) {
    const legacy = { ...dossier(), categorie: 'Visite Globale', profil_metier: profil };
    const html = buildDecisionHtml(legacy);
    for (const text of ['Projection 1', 'Projection 2', 'Comparaison des conséquences', 'Arbitrage à discuter', 'Vérifier le parcours d’air']) assert.ok(html.includes(text), `${profil} ${text}`);
  }
});

test('Habitologue keeps the useful warnings of sections 1 to 3 and drops those of the projections', () => {
  const report = habitologue(); report.decision.projet.budget = '';
  report.decision.attentes.push({ ...report.decision.attentes[0] });
  report.decision.liens.push({ id: 'l2', observation_id: 'absente', attente_ids: [], effet: '', verification: '' });
  report.decision.actions.push({ id: 'a1', intitule: '', categorie: '', observation_ids: ['absente'], attente_ids: [], incontournable: true });
  report.decision.option_a.action_ids = []; report.decision.option_b.objectif = ''; report.decision.arbitrage.option_proposee = 'z';
  const warnings = decisionWarnings(report).join('\n');
  for (const expected of [/Attentes : identifiant absent ou dupliqué/, /introuvable.*absente/, /préciser une attente et son effet/, /Budget.*non renseigné/]) assert.match(warnings, expected);
  for (const unexpected of [/Actions/, /Action/, /Option/, /incontournable/, /arbitrage/, /objectif et actions/]) assert.doesNotMatch(warnings, unexpected);
  const html = buildDecisionHtml(report);
  assert.match(html, /Points restant à compléter/); assert.match(html, /Budget des habitants/); assert.doesNotMatch(html, /Action|Option/);
  // The same data keeps every projection warning for the historical parcours.
  report.profil_metier = undefined;
  const historical = decisionWarnings(report).join('\n');
  for (const expected of [/Actions : identifiant absent ou dupliqué/, /Option A : objectif et actions à préciser/, /Option proposée introuvable/]) assert.match(historical, expected);
});

test('hidden projection data alone neither creates a Word section nor a warning for Habitologue', () => {
  const report = { categorie: 'Visite Globale', profil_metier: 'habitologue', observations: [], decision: normalizeDecision() };
  report.decision.actions = [{ id: 'a1', intitule: 'Conservée', categorie: '', observation_ids: [], attente_ids: [] }];
  report.decision.option_a.objectif = 'Conservé'; report.decision.arbitrage.motif = 'Conservé';
  assert.equal(hasDecisionData(report, false), false); assert.equal(hasDecisionData(report), true);
  assert.equal(buildDecisionHtml(report), ''); assert.equal(buildDecisionHtml(report, true), ''); assert.deepEqual(decisionWarnings(report), []);
  assert.equal(report.decision.actions.length, 1);
  report.profil_metier = undefined;
  assert.notEqual(buildDecisionHtml(report), ''); assert.ok(decisionWarnings(report).length > 0);
});

test('the references kept in sections 1 to 3 stay controlled for Habitologue', () => {
  const report = habitologue(); report.observations = [];
  assert.match(buildDecisionHtml(report), /Référence introuvable \(o1\)/); assert.match(decisionWarnings(report).join('\n'), /introuvable.*o1/);
  report.observations = [{ id: 'o1', titre: 'A' }, { id: 'o1', titre: 'B' }];
  assert.match(buildDecisionHtml(report), /ambiguë/);
  report.decision.schema_version = 2;
  assert.match(buildDecisionHtml(report), /Format non pris en charge/); assert.match(decisionWarnings(report).join('\n'), /non pris en charge/);
});

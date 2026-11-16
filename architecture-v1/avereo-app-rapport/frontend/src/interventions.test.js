import test from 'node:test';
import assert from 'node:assert/strict';
import { allowsInterventions, clientInterventions, interventionWarnings, buildInterventionsHtml } from './interventions.js';
import { normalizeDecision } from './decisionSupport.js';
import { buildReportHtml } from './reportDelivery.js';

function dossier() {
  return { categorie: 'Visite Globale', profil_metier: 'habitologue', titre: 'Recette fictive', reference_dossier: 'TEST-INTERVENTIONS',
    meteo: {}, cadastre: {}, urbanisme: {}, risques: {}, terrain: {}, localisation: {}, ressources_batiment: {}, protocoles: {},
    recommandations: 'RECOMMANDATION TEMOIN', reserves: 'RESERVES TEMOIN',
    observations: [{ id: 't1', phase_habitologie: 'terrain', titre: 'Accès au jardin', observations: 'Observation retenue', photos: [] },
      { id: 'o1', phase_habitologie: 'feu', titre: 'CONFIDENTIEL CHAUFFAGE', observations: 'Constat exclu', photos: [] }],
    livrable: { observations: ['t1'] }, decision: { attentes: [{ id: 'w1', libelle: 'Conserver un accès' }],
      actions: [{ id: 'a1', intitule: 'Vérifier les accès', categorie: 'Préventif', incontournable: true, priorite: 'À discuter', horizon: 'Avant le choix des travaux',
        observation_ids: ['t1'], attente_ids: ['w1'], realisation: 'Visite avec un professionnel', prealables: 'PREALABLE INTERNE', explication: 'NOTE INTERNE', inclure_client: true,
        propriete_future: { conservee: true } }], option_a: { action_ids: ['a1'] } } };
}

test('interventions keep the historical list, unknown fields and option identifiers without mutation', () => {
  const report = dossier(), before = JSON.stringify(report);
  const loaded = JSON.parse(before), d = normalizeDecision(loaded.decision);
  assert.equal(d.actions[0].id, 'a1'); assert.deepEqual(d.option_a.action_ids, ['a1']);
  assert.deepEqual(d.actions[0].propriete_future, { conservee: true });
  assert.match(buildInterventionsHtml(loaded), /Visite avec un professionnel/);
  assert.deepEqual(interventionWarnings(loaded), []); assert.equal(JSON.stringify(loaded), before);
});

test('expert interventions follow recommendations without restoring Habitologue projections', () => {
  const report = dossier(), html = buildReportHtml(report);
  assert.ok(html.indexOf('RECOMMANDATION TEMOIN') < html.indexOf('<h2>Interventions proposées'));
  assert.ok(html.indexOf('<h2>Interventions proposées') < html.indexOf('RESERVES TEMOIN'));
  assert.match(html, /T1 · Accès au jardin/); assert.match(html, /PREALABLE INTERNE/);
  assert.doesNotMatch(html, /Projection 1|Deux options de projet|Comparaison des conséquences/);
});

test('client needs an explicit choice and retains only fully selected unambiguous findings', () => {
  const report = dossier();
  assert.equal(clientInterventions(report).length, 1);
  assert.doesNotMatch(buildInterventionsHtml(report, true), /NOTE INTERNE|PREALABLE INTERNE|CONFIDENTIEL/);
  delete report.decision.actions[0].inclure_client;
  assert.equal(buildInterventionsHtml(report, true), '');
  report.decision.actions[0].inclure_client = 'true'; assert.equal(buildInterventionsHtml(report, true), '');
  report.decision.actions[0].inclure_client = true;
  report.decision.actions[0].observation_ids.push('o1');
  assert.equal(buildInterventionsHtml(report, true), '');
  assert.match(interventionWarnings(report).join('\n'), /exclue de la synthèse/);
});

test('missing or duplicate references never select an arbitrary finding for the client', () => {
  for (const variation of ['missing', 'duplicate', 'duplicateAction', 'unlinked']) {
    const report = dossier();
    if (variation === 'missing') report.observations = [];
    if (variation === 'duplicate') report.observations.push({ ...report.observations[0] });
    if (variation === 'duplicateAction') report.decision.actions.push({ ...report.decision.actions[0] });
    if (variation === 'unlinked') report.decision.actions[0].observation_ids = [];
    assert.equal(buildInterventionsHtml(report, true), '', variation);
    assert.ok(interventionWarnings(report).length, variation);
  }
});

test('legacy profiles, non-global reports and unsupported decision schemas keep their existing behaviour', () => {
  for (const profile of [undefined, 'architecte', 'maitre_oeuvre', 'inconnu']) {
    const report = dossier(); report.profil_metier = profile;
    assert.equal(allowsInterventions(report), false); assert.equal(buildInterventionsHtml(report), '');
  }
  const report = dossier(); report.categorie = 'Expertise & Visite technique'; assert.equal(buildInterventionsHtml(report), '');
  report.categorie = 'Visite Globale'; report.decision.schema_version = 2; assert.equal(buildInterventionsHtml(report), '');
});

test('all intervention text is escaped and no calendar is fabricated from a qualitative horizon', () => {
  const report = dossier(); report.decision.actions[0].intitule = '<script>bad()</script>';
  report.decision.actions[0].realisation = '<img src=x onerror=bad()>'; const before = JSON.stringify(report);
  for (const client of [false, true]) {
    const html = buildInterventionsHtml(report, client);
    assert.doesNotMatch(html, /<script>|<img src=x|2026-|Date de début|Durée calculée/);
    assert.match(html, /&lt;script&gt;/); assert.match(html, /&lt;img/); assert.match(html, /Avant le choix des travaux/);
  }
  assert.equal(JSON.stringify(report), before);
});

test('the complete client delivery never reintroduces an intervention linked to an excluded finding', () => {
  const report = dossier(); report.livrable.audience = 'client';
  report.decision.actions[0].observation_ids = ['o1']; report.decision.actions[0].intitule = 'INTERVENTION EXCLUE';
  const html = buildReportHtml(report);
  assert.doesNotMatch(html, /INTERVENTION EXCLUE|CONFIDENTIEL CHAUFFAGE|NOTE INTERNE|PREALABLE INTERNE/);
  assert.match(html, /Observation retenue/);
});

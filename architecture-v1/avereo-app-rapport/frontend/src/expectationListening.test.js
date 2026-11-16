import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDecision, buildDecisionHtml } from './decisionSupport.js';
import { copyListeningExpectation, listeningExpectationSources } from './expectationListening.js';
import { readReportFile } from './reportFiles.js';

const listening = { attentes_client: 'Du calme dans la chambre.\nGarder le jardin.', besoin_reformule: 'Pouvoir dormir sans bruit.' };

test('explicit copy keeps verbatim and stable reference IDs after editing and interview changes', () => {
  const original = { ...normalizeDecision(), retained_extension: { value: 'unchanged' } };
  const copied = copyListeningExpectation(original, listening, 'attentes_client', 'w1');
  assert.equal(original.attentes.length, 0);
  assert.equal(copied.attentes[0].libelle, listening.attentes_client);
  assert.deepEqual(copied.attentes[0].provenance_ecoute, { champ: 'attentes_client', texte_original: listening.attentes_client });
  copied.attentes[0].libelle = 'Préserver le calme le soir';
  copied.liens = [{ id: 'l1', observation_id: 'o1', attente_ids: ['w1'] }];
  copied.actions = [{ id: 'a1', attente_ids: ['w1'] }];
  const before = JSON.stringify(copied);
  const changedListening = { ...listening, attentes_client: 'Autre priorité' };
  assert.equal(copyListeningExpectation(copied, changedListening, 'attentes_client', 'w2'), copied);
  assert.equal(JSON.stringify(copied), before);
  assert.equal(listeningExpectationSources(copied, changedListening)[0].changed, true);
  assert.equal(listeningExpectationSources(copied, listening)[0].changed, false);
  assert.deepEqual(copied.liens[0].attente_ids, ['w1']);
  assert.deepEqual(copied.actions[0].attente_ids, ['w1']);
});

test('repeat, identical existing wording, empty or invalid sources never create extra expectations', () => {
  const d = normalizeDecision();
  for (const field of ['absent', 'attentes_client']) assert.equal(copyListeningExpectation(d, {}, field, 'w1'), d);
  assert.equal(copyListeningExpectation(d, listening, 'motif_visite', 'w1'), d);
  const once = copyListeningExpectation(d, listening, 'attentes_client', 'w1');
  assert.equal(copyListeningExpectation(once, listening, 'attentes_client', 'w2'), once);
  const manual = { ...d, attentes: [{ id: 'manual', libelle: listening.attentes_client, source: 'Métier' }] };
  assert.equal(copyListeningExpectation(manual, listening, 'attentes_client', 'w1'), manual);
  assert.equal(manual.attentes[0].provenance_ecoute, undefined);
  const other = copyListeningExpectation(once, listening, 'besoin_reformule', 'w2');
  assert.equal(other.attentes.length, 2);
  assert.equal(other.attentes[1].libelle, listening.besoin_reformule);
});

test('limits and future schemas preserve existing data and refuse copying', () => {
  const full = { ...normalizeDecision(), attentes: Array.from({length: 100}, (_, i) => ({id: `w${i}`, libelle: `Attente ${i}`})) };
  assert.equal(copyListeningExpectation(full, listening, 'attentes_client', 'new'), full);
  const future = { schema_version: 2, attentes: [] };
  assert.equal(copyListeningExpectation(future, listening, 'attentes_client', 'new'), future);
  assert.equal(copyListeningExpectation(full, listening, 'attentes_client', 'w1'), full);
});

test('JSON keeps notes, provenance, linked IDs and all adjacent report data', () => {
  const decision = copyListeningExpectation(normalizeDecision(), listening, 'attentes_client', 'w1');
  decision.notes_attentes = 'Note dictée complémentaire';
  const report = { id: 'fiction', categorie: 'Visite Globale', profil_metier: 'habitologue', ecoute: listening,
    observations: [{id:'o1', terrain: true}], photos: [{id:'p1'}], plans: [{id:'plan'}], signature: 'signature', decision };
  const file = JSON.stringify(report);
  const restored = readReportFile(file);
  assert.deepEqual(restored, report);
  assert.equal(normalizeDecision(restored.decision).notes_attentes, 'Note dictée complémentaire');
  assert.equal(restored.decision.attentes[0].provenance_ecoute.texte_original, listening.attentes_client);
});

test('expert renders escaped notes; client excludes notes and retained interview provenance', () => {
  const decision = copyListeningExpectation(normalizeDecision(), listening, 'attentes_client', 'w1');
  decision.attentes[0].libelle = 'Attente reformulée publique';
  decision.notes_attentes = '<script>note interne</script>';
  const report = { categorie: 'Visite Globale', profil_metier: 'habitologue', observations: [], decision };
  const expert = buildDecisionHtml(report), client = buildDecisionHtml(report, true);
  assert.match(expert, /Notes complémentaires sur les attentes/);
  assert.match(expert, /&lt;script&gt;note interne&lt;\/script&gt;/);
  assert.doesNotMatch(expert, /<script>/);
  assert.match(client, /Attente reformulée publique/);
  assert.doesNotMatch(client, /note interne|Texte d’origine|Du calme|Dossier \/ Écoute/);
});

test('legacy reports gain no expectations merely from listening notes', () => {
  const legacy = { ecoute: listening };
  assert.equal(buildDecisionHtml(legacy), '');
  assert.deepEqual(normalizeDecision().attentes, []);
  assert.equal(normalizeDecision().notes_attentes, '');
});


test('notes alone are retained in expert but create no empty decision section in client', () => {
  const report = { categorie: 'Visite Globale', profil_metier: 'habitologue', decision: { notes_attentes: 'Notes seules' } };
  assert.match(buildDecisionHtml(report), /Notes seules/);
  assert.equal(buildDecisionHtml(report, true), '');
});

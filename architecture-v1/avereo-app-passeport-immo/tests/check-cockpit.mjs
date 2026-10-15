// Vérifie le raccordement du suivi réel au contrat de présentation du cockpit.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { reviewFollowUpPullRequests } from '../../avereo-app-projet/frontend/src/review/review-pull-request.mjs';

const state = JSON.parse(await readFile(new URL('../docs/suivi-chantier.json', import.meta.url), 'utf8'));
const phase = state.phases.find(item => item.id === 0);
const requests = reviewFollowUpPullRequests(state.reviewFollowUps, phase);
const followUp = requests.find(item => item.request.url === state.developmentWorkflow.github.followUpPrUrl);
assert.ok(followUp, 'La PR de suivi doit produire une carte dans la revue de phase 0.');
assert.equal(followUp.request.number, 72);
assert.equal(followUp.request.state, state.developmentWorkflow.github.followUpObservation.state);
assert.equal(phase.deliverables[0].path, 'iteration-developpement.md', 'L’itération réelle doit être accessible dès la phase 0.');
const document = await readFile(new URL('../docs/iteration-developpement.md', import.meta.url), 'utf8');
assert.ok(document.includes('## Où en est le développement ?'));
assert.ok(document.includes(state.developmentWorkflow.github.followUpPrUrl));
const approval = state.decisions.find(item => item.id === phase.validationEvidence?.decisionId);
const frozen = approval?.evidence?.reviewedArtifacts?.find(item => item.path === 'iteration-developpement.md');
if (frozen) {
  assert.equal(createHash('sha256').update(Buffer.from(document)).digest('hex'), frozen.sha256, 'La fiche historique doit conserver ses octets approuvés.');
} else assert.ok(document.includes(`phase ${state.currentPhase} —`));
assert.deepEqual(state.phases.map(item => item.title), ['Cadrage', 'Développement local', 'Préproduction', 'Mise en production']);
assert.equal(state.legacyTracking.phases.length, 6, 'Le découpage antérieur doit rester conservé.');
const decisionIds = state.decisions.map(item => item.id);
assert.equal(new Set(decisionIds).size, decisionIds.length, 'Les décisions conservent des identifiants uniques.');
for (const historical of state.legacyTracking.decisions) {
  assert.ok(decisionIds.includes(historical.id), `Décision historique conservée : ${historical.id}`);
}
// Later human reviews may add decisions without deleting or renumbering the archive.
const reviewScope = state.developmentWorkflow.documentsLot?.reviewScope;
if (reviewScope) {
  const local = state.phases.find(item => item.id === reviewScope.phaseId);
  const preproduction = state.phases.find(item => item.id === reviewScope.deferredConnect.phaseId);
  assert.ok(!local.deliverables.some(item => item.path === reviewScope.deferredConnect.deliverable));
  assert.ok(preproduction.deliverables.some(item => item.path === reviewScope.deferredConnect.deliverable), 'CONNECT reste un prérequis explicite.');
  for (const criterion of reviewScope.deferredConnect.exitCriteria) {
    assert.ok(preproduction.exitCriteria.includes(criterion));
    assert.ok(!local.exitCriteria.includes(criterion));
  }
}
for (const decision of state.legacyTracking.decisions.filter(item => item.type === 'approval')) {
  for (const proof of decision.evidence.reviewedArtifacts) {
    const bytes = await readFile(new URL(`../docs/${proof.path}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), proof.sha256, `Preuve historique conservée : ${proof.path}`);
  }
}
const dashboard = await readFile(new URL('../docs/tableau-de-bord.md', import.meta.url), 'utf8');
for (const item of state.phases) assert.ok(dashboard.includes(item.title), `Phase courante affichée : ${item.title}`);
console.log('Quatre phases et PR raccordées ; décisions originales archivées, preuves approuvées intactes et tableau courant aligné.');

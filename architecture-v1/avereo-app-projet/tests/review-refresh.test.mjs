import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRefreshGate, reconcileDrafts, retainedDocument } from '../frontend/src/review/review-refresh.mjs';
import { createReviewStore } from '../workflows/review-store.mjs';
import { demoState, demoDocument } from '../workflows/review-fixture.mjs';

function snapshot() {
  return { source: 'fixture/suivi-chantier.json', revision: 'one', data: { phases: [
    { id: 0, status: 'awaiting_review', exitCriteria: ['Vérifier la preuve'], deliverables: [{ path: 'audit.md' }] },
    { id: 1, status: 'not_started', exitCriteria: ['Vérifier la suite'], deliverables: [{ path: 'suite.md' }] },
  ] }, documents: [{ phaseId: 0, path: 'audit.md', sha256: 'first' }], issues: [], actions: { 0: ['comment', 'approve'], 1: ['comment'] } };
}
const draft = () => ({ reviewer: 'Responsable', comment: 'Mon commentaire en cours', action: 'approve', checks: [0], read: ['audit.md:first'], confirm: true });

test('une observation externe actualise le suivi sans effacer les brouillons ni attestations inchangées', () => {
  const previous = snapshot();
  const incoming = structuredClone(previous);
  incoming.revision = 'new-comment';
  incoming.data.reviewEvents = [{ action: 'comment', phaseId: 0, comment: 'Autre remarque' }];
  incoming.data.phases[0].nextAction = 'Information de progression actualisée';
  const drafts = { 0: draft(), 1: draft() };
  assert.deepEqual(reconcileDrafts(drafts, previous, incoming), drafts);
});

test('une preuve modifiée invalide seulement les attestations concernées et préserve le texte', () => {
  const previous = snapshot();
  const incoming = structuredClone(previous);
  incoming.documents[0].sha256 = 'second';
  const drafts = { 0: draft(), 1: draft() };
  const result = reconcileDrafts(drafts, previous, incoming);
  assert.deepEqual(result[0], { ...draft(), read: [], checks: [], confirm: false });
  assert.deepEqual(result[1], drafts[1]);
  assert.deepEqual(drafts[0], draft(), 'Le brouillon original reste intact.');
});

test('critères, contenu attendu, autorisation et preuve amont invalident leur revue dépendante', () => {
  const previous = snapshot();
  previous.data.phases[1].dependsOn = [0];
  for (const edit of [
    view => view.data.phases[0].exitCriteria.push('Un nouveau critère'),
    view => { view.data.phases[0].deliverables[0].expectedEvidence = ['Nouvelle preuve attendue']; },
    view => { view.data.phases[0].startEvidence = { decisionId: 'D02' }; },
    view => { view.documents[0].sha256 = 'changed'; },
    view => { view.actions[0] = ['comment']; },
  ]) {
    const incoming = structuredClone(previous); edit(incoming);
    const result = reconcileDrafts({ 0: draft(), 1: draft() }, previous, incoming);
    assert.equal(result[0].confirm, false);
    assert.equal(result[1].confirm, false);
    assert.equal(result[1].comment, draft().comment);
  }
});

test('la source et la disparition du livrable invalident les preuves, la sélection reste stable si possible', () => {
  const previous = snapshot();
  const incoming = structuredClone(previous); incoming.source = 'other/suivi-chantier.json';
  assert.equal(reconcileDrafts({ 0: draft() }, previous, incoming)[0].confirm, false);
  incoming.source = previous.source; incoming.documents = [];
  assert.equal(reconcileDrafts({ 0: draft() }, previous, incoming)[0].confirm, false);
  const files = [{ path: 'audit.md' }, { path: 'second.md' }, { path: 'new.md' }];
  assert.equal(retainedDocument('second.md', files), 'second.md');
  assert.equal(retainedDocument('gone.md', files), 'audit.md');
  assert.equal(retainedDocument('second.md', []), '');
});

test('un changement du document sur disque est détecté sans changement du JSON', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'avereo-refresh-test-'));
  await writeFile(join(folder, 'suivi-chantier.json'), JSON.stringify(demoState()));
  await writeFile(join(folder, 'audit-demo.md'), demoDocument);
  const store = await createReviewStore(folder);
  const initialBytes = await readFile(join(folder, 'suivi-chantier.json'), 'utf8');
  const previous = await store.snapshot();
  await writeFile(join(folder, 'audit-demo.md'), demoDocument + '\nPreuve modifiée pour ce test.');
  const incoming = await store.snapshot();
  assert.equal(await readFile(join(folder, 'suivi-chantier.json'), 'utf8'), initialBytes);
  assert.notEqual(previous.revision, incoming.revision);
  assert.notEqual(previous.documents[0].sha256, incoming.documents[0].sha256);
  assert.equal(reconcileDrafts({ 0: draft() }, previous, incoming)[0].confirm, false);
});

test('un GET commencé avant un POST ne remplace pas sa réponse et les lectures attendent la fin de l’écriture', async () => {
  const gate = createRefreshGate();
  let resolveRead;
  const read = new Promise(resolve => { resolveRead = resolve; });
  const ticket = gate.beginRead();
  assert.notEqual(ticket, null);
  assert.equal(gate.beginRead(), null, 'Pas de chevauchement des sondages.');
  let current = 'initial';
  const completed = read.then(value => { if (gate.accepts(ticket)) current = value; gate.finishRead(ticket); });
  assert.equal(gate.beginWrite(), true);
  assert.equal(gate.beginWrite(), false);
  assert.equal(gate.beginRead(), null);
  current = 'saved';
  gate.finishWrite();
  resolveRead('stale'); await completed;
  assert.equal(current, 'saved');
  const next = gate.beginRead();
  assert.equal(gate.accepts(next), true);
  gate.finishRead(ticket);
  assert.equal(gate.accepts(next), true, 'Une ancienne réponse ne libère pas la nouvelle lecture.');
  gate.finishRead(next);
  assert.equal(gate.accepts(next), false);
});

test('le démontage ou une reprise annule la lecture précédente sans bloquer le prochain sondage', () => {
  const gate = createRefreshGate();
  const previous = gate.beginRead();
  gate.cancelRead();
  const next = gate.beginRead();
  assert.equal(gate.accepts(previous), false);
  assert.equal(gate.accepts(next), true);
  gate.finishRead(next);
  assert.notEqual(gate.beginRead(), null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createReviewStore } from '../workflows/review-store.mjs';
import { demoState, demoDocument } from '../workflows/review-fixture.mjs';

async function fixture(options) {
  const root = await mkdtemp(join(tmpdir(), 'avereo-review-test-'));
  await writeFile(join(root, 'suivi-chantier.json'), JSON.stringify(demoState(), null, 2));
  await writeFile(join(root, 'audit-demo.md'), demoDocument);
  const store = await createReviewStore(root, options);
  const perform = async (action, extra = {}) => {
    const view = await store.snapshot();
    return store.act({ revision: view.revision, phaseId: 0, action, reviewer: 'Recette automatique', comment: 'Vérification sur données fictives uniquement.', confirm: true, checkedCriteria: [0, 1], reviewedArtifacts: view.documents.filter(d => d.phaseId === 0).map(({ path, sha256 }) => ({ path, sha256 })), ...extra });
  };
  return { root, store, perform };
}

test('approbation durable avec preuves ; autorisation et démarrage restent distincts', async () => {
  const { root, store, perform } = await fixture();
  await assert.rejects(perform('authorize_next'), { status: 409 });
  const approved = await perform('approve');
  assert.equal(approved.data.phases[0].status, 'validated');
  assert.equal(approved.data.phases[1].startedOn, null);
  assert.equal(approved.data.phases[1].startEvidence, undefined);
  const reopened = await (await createReviewStore(root)).snapshot();
  assert.deepEqual(reopened.data, approved.data);
  assert.equal(reopened.data.reviewEvents[0].reviewedArtifacts[0].sha256.length, 64);
  assert.deepEqual(reopened.data.reviewEvents[0].checkedCriteria, demoState().phases[0].exitCriteria);
  const authorized = await perform('authorize_next');
  assert.equal(authorized.data.phases[1].status, 'not_started');
  assert.equal(authorized.data.currentPhase, 0);
  assert.ok(authorized.actions[1].includes('start'));
  const started = await perform('start', { phaseId: 1 });
  assert.equal(started.data.currentPhase, 1);
  assert.equal(started.data.phases[1].status, 'in_progress');
  assert.deepEqual(started.data.publication, demoState().publication);
  assert.equal((await readdir(join(root, '.review-backups'))).length, 3);
  assert.ok(!(await readdir(root)).includes('.projet-review.lock'));
  assert.ok(!(await store.snapshot()).actions[0].includes('request_changes'));
});

test('critères, lecture, identité, commentaire et confirmation sont obligatoires côté serveur', async () => {
  const { root, perform } = await fixture();
  const before = await readFile(join(root, 'suivi-chantier.json'), 'utf8');
  for (const invalid of [{ checkedCriteria: [] }, { checkedCriteria: [0, 0] }, { reviewedArtifacts: [] }, { reviewer: '' }, { comment: '' }, { confirm: false }]) await assert.rejects(perform('approve', invalid), { status: 422 });
  assert.equal(await readFile(join(root, 'suivi-chantier.json'), 'utf8'), before);
});

test('un suivi ou livrable modifié refuse la décision ancienne sans perte', async () => {
  const { root, store, perform } = await fixture();
  const initial = await store.snapshot();
  await writeFile(join(root, 'audit-demo.md'), demoDocument + '\nNouvelle version.');
  await assert.rejects(perform('approve', { revision: initial.revision }), { status: 409 });
  assert.equal((await store.snapshot()).data.reviewEvents, undefined);
  const beforeComment = await store.snapshot();
  await perform('comment');
  await assert.rejects(perform('approve', { revision: beforeComment.revision }), { status: 409 });
});

test('deux décisions concurrentes ne peuvent pas écraser leur journal', async () => {
  const { store, perform } = await fixture();
  const { revision } = await store.snapshot();
  const results = await Promise.allSettled([perform('comment', { revision }), perform('comment', { revision })]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.status, 409);
  assert.equal((await store.snapshot()).data.reviewEvents.length, 1);
});

test('correction, nouvelle remise et approbation conservent les décisions antérieures', async () => {
  const { root, store, perform } = await fixture();
  await perform('approve');
  await perform('authorize_next');
  const changes = await perform('request_changes');
  assert.equal(changes.data.phases[0].status, 'in_progress');
  assert.equal(changes.data.phases[0].validatedOn, null);
  assert.equal(changes.data.phases[1].startEvidence, undefined);
  assert.ok(changes.data.decisions.every(d => d.status === 'superseded'));
  await assert.rejects(perform('approve'), { status: 409 });
  await writeFile(join(root, 'audit-demo.md'), demoDocument + '\nCorrection documentée.');
  await perform('submit');
  const approved = await perform('approve');
  assert.equal(approved.data.reviewEvents.length, 5);
  assert.notEqual(approved.data.reviewEvents[0].reviewedArtifacts[0].sha256, approved.data.reviewEvents[4].reviewedArtifacts[0].sha256);
  assert.ok((await store.snapshot()).actions[0].includes('authorize_next'));
});

test('un livrable modifié après approbation bloque l’autorisation et le démarrage', async () => {
  const { root, store, perform } = await fixture();
  await perform('approve'); await perform('authorize_next');
  await writeFile(join(root, 'audit-demo.md'), demoDocument + '\nChangement après accord.');
  await assert.rejects(perform('start', { phaseId: 1 }), { status: 409 });
  assert.ok(!(await store.snapshot()).actions[0].includes('authorize_next'));
});

test('document manquant, chemin externe et fichier non déclaré ne sont pas approuvables', async () => {
  const { root, store, perform } = await fixture();
  await assert.rejects(store.document('../secret.md'), { status: 404 });
  const data = demoState(); data.phases[0].deliverables = [{ path: '../absent.md', kind: 'file', availability: 'present' }];
  await writeFile(join(root, 'suivi-chantier.json'), JSON.stringify(data));
  const view = await store.snapshot();
  assert.equal(view.documents.length, 0);
  assert.ok(view.issues.some(i => i.message.includes('hors')));
  await assert.rejects(perform('approve'), { status: 409 });
});

test('les dossiers de livrables déclarés sont inventoriés et les jonctions externes refusées', async () => {
  const { root, store, perform } = await fixture();
  const external = await mkdtemp(join(tmpdir(), 'avereo-external-'));
  await writeFile(join(external, 'secret.md'), 'Fichier externe de test.');
  await symlink(external, join(root, 'outside'), process.platform === 'win32' ? 'junction' : 'dir');
  const data = demoState(); data.phases[0].deliverables.push({ path: 'outside/', kind: 'directory', availability: 'present' });
  await writeFile(join(root, 'suivi-chantier.json'), JSON.stringify(data));
  assert.ok((await store.snapshot()).issues.some(i => i.path === 'outside/'));
  await assert.rejects(perform('approve'), { status: 409 });
  await mkdir(join(root, 'adr'));
  await writeFile(join(root, 'adr/choix.md'), '# Décision locale');
  data.phases[0].deliverables.pop(); data.phases[0].deliverables.push({ path: 'adr/', kind: 'directory', availability: 'present' });
  await writeFile(join(root, 'suivi-chantier.json'), JSON.stringify(data));
  assert.equal((await store.snapshot()).documents.filter(d => d.phaseId === 0).length, 2);
  await perform('approve');
});

test('verrou externe et panne du générateur sont signalés sans fausse confirmation', async () => {
  const { root, store, perform } = await fixture({ refreshViews: async () => { throw new Error('Python absent'); } });
  await writeFile(join(root, '.projet-review.lock'), 'Verrou de test');
  await assert.rejects(perform('comment'), { status: 409 });
  assert.equal((await store.snapshot()).data.reviewEvents, undefined);
  const second = await fixture({ refreshViews: async () => { throw new Error('Python absent'); } });
  const result = await second.perform('comment');
  assert.equal(result.derivedViews.status, 'failed');
  assert.equal((await second.store.snapshot()).data.reviewEvents.length, 1);
});

test('les décisions D03/D04 existantes sont complétées sans duplication', async () => {
  const { root, perform } = await fixture();
  const data = demoState();
  data.decisions = [{ id: 'D03', title: 'Valider le livrable de phase 0', status: 'pending' }, { id: 'D04', title: 'Autoriser le passage en phase 1', status: 'pending' }];
  await writeFile(join(root, 'suivi-chantier.json'), JSON.stringify(data));
  await perform('approve');
  const result = await perform('authorize_next');
  assert.equal(result.data.decisions.length, 2);
  assert.equal(result.data.phases[0].validationEvidence.decisionId, 'D03');
  assert.equal(result.data.phases[1].startEvidence.decisionId, 'D04');
});

test('une preuve amont périmée bloque aussi les phases dépendantes indirectement', async () => {
  const { root, store, perform } = await fixture();
  const data = demoState();
  data.phases.push({ ...structuredClone(data.phases[1]), id: 2, dependsOn: [1] });
  await writeFile(join(root, 'suivi-chantier.json'), JSON.stringify(data));
  await perform('approve'); await perform('authorize_next'); await perform('start', { phaseId: 1 });
  await writeFile(join(root, 'suite-demo.md'), '# Suite fictive');
  await perform('submit', { phaseId: 1 });
  const view = await store.snapshot();
  await perform('approve', { phaseId: 1, checkedCriteria: [0], reviewedArtifacts: view.documents.filter(d => d.phaseId === 1).map(({ path, sha256 }) => ({ path, sha256 })) });
  assert.ok((await store.snapshot()).actions[1].includes('authorize_next'));
  await writeFile(join(root, 'audit-demo.md'), demoDocument + '\nModification amont.');
  await assert.rejects(perform('authorize_next', { phaseId: 1 }), { status: 409 });
});

test('la limite de stockage est vérifiée avant écriture pour garder le suivi lisible', async () => {
  const { root, perform } = await fixture();
  const data = demoState(); data.padding = 'x'.repeat(2 * 1024 * 1024 - 7000);
  const original = JSON.stringify(data);
  await writeFile(join(root, 'suivi-chantier.json'), original);
  await assert.rejects(perform('comment', { comment: 'x'.repeat(8000) }), { status: 422 });
  assert.equal(await readFile(join(root, 'suivi-chantier.json'), 'utf8'), original);
});

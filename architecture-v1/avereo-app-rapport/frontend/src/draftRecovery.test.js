import assert from 'node:assert/strict';
import test from 'node:test';
import { latestDraft } from './draftRecovery.js';

test('an old fallback cannot hide a newer IndexedDB draft, including images and server id', () => {
  const previous = { titre: 'ancienne copie', updatedAt: '2026-10-23T10:00:00Z' };
  const current = { titre: 'texte corrigé O2', updatedAt: '2026-10-24T10:00:00Z', onlineReportId: '123', observations: [{ photos: ['data:image/png;base64,AA=='] }] };
  assert.equal(latestDraft([previous, current]), current);
  assert.equal(latestDraft([current, previous]), current);
  assert.deepEqual(latestDraft([previous, current]).observations, current.observations);
});
test('fallback and undated legacy drafts remain readable without inventing an empty draft', () => {
  const legacy = { titre: 'ancien dossier' };
  assert.equal(latestDraft([null, legacy, undefined]), legacy);
  assert.equal(latestDraft([null, 'broken', []]), null);
  assert.equal(latestDraft([legacy, { updatedAt: 'invalid' }]), legacy);
});

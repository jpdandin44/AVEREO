import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewFollowUpPullRequests, reviewPullRequest } from '../frontend/src/review/review-pull-request.mjs';

const sample = () => ({
  url: 'https://github.com/jpdandin44/avereo-site-drupal/pull/12',
  repository: 'jpdandin44/avereo-site-drupal',
  number: 12,
  state: 'open',
  headSha: 'a'.repeat(40),
  observedAt: '2026-09-25T08:00:00Z',
});

test('absence de métadonnées PR conserve les anciens suivis sans carte', () => {
  for (const value of [undefined, null, '', [], {}]) assert.equal(reviewPullRequest(value), null);
});

test('une PR cohérente est présentée sans modifier les données sources', () => {
  const source = sample();
  const before = structuredClone(source);
  const result = reviewPullRequest(source);
  assert.equal(result.url, source.url);
  assert.equal(result.label, 'Ouverte');
  assert.equal(result.headSha, source.headSha);
  assert.equal(result.observedAt, '2026-09-25T08:00:00.000Z');
  assert.equal(result.mergedAt, null);
  assert.deepEqual(source, before);
});

test('URL exécutable, hôte trompeur, identifiants, port et sous-chemin sont refusés', () => {
  const urls = [
    'javascript:alert(1)',
    'http://github.com/jpdandin44/avereo-site-drupal/pull/12',
    'https://github.com.evil.example/jpdandin44/avereo-site-drupal/pull/12',
    'https://github.com@evil.example/jpdandin44/avereo-site-drupal/pull/12',
    'https://someone@github.com/jpdandin44/avereo-site-drupal/pull/12',
    'https://github.com:444/jpdandin44/avereo-site-drupal/pull/12',
    'https://github.com/jpdandin44/avereo-site-drupal/pull/12/files',
    'https://github.com/jpdandin44/avereo-site-drupal/pull/12?return=elsewhere',
    'https://github.com/jpdandin44/avereo-site-drupal/pull/12#other',
  ];
  for (const url of urls) assert.equal(reviewPullRequest({ ...sample(), url }), null, url);
});

test('le dépôt, le numéro, l’état, la révision et la date doivent être cohérents', () => {
  for (const patch of [
    { repository: 'other/repo' }, { number: 13 }, { number: '12' }, { number: 0 },
    { state: 'approved' }, { headSha: 'short' }, { observedAt: 'yesterday' },
    { observedAt: '2026-02-30T08:00:00Z' }, { observedAt: '2026-09-25' },
  ]) assert.equal(reviewPullRequest({ ...sample(), ...patch }), null, JSON.stringify(patch));
});

test('un état fusionné garde ses preuves datées sans en déduire une approbation', () => {
  const source = { ...sample(), state: 'merged', mergedAt: '2026-09-25T09:15:00+02:00', mergeCommitSha: 'b'.repeat(40), mergedBy: ' jpdandin44 ' };
  const result = reviewPullRequest(source);
  assert.equal(result.label, 'Fusionnée');
  assert.equal(result.mergedAt, '2026-09-25T07:15:00.000Z');
  assert.equal(result.mergeCommitSha, source.mergeCommitSha);
  assert.equal(result.mergedBy, 'jpdandin44');
  assert.equal('approved' in result, false);
  assert.equal('validatedOn' in result, false);
});

test('les attributs de fusion ne sont affichés que pour un état fusionné', () => {
  for (const state of ['open', 'closed']) {
    const result = reviewPullRequest({ ...sample(), state, mergedAt: '2026-09-25T09:15:00Z', mergeCommitSha: 'b'.repeat(40), mergedBy: 'owner' });
    assert.equal(result.mergedAt, null);
    assert.equal(result.mergeCommitSha, null);
    assert.equal(result.mergedBy, null);
  }
  assert.equal(reviewPullRequest({ ...sample(), state: 'closed' }).label, 'Fermée sans fusion');
});

test('une preuve de fusion facultative invalide n’invente aucune valeur de remplacement', () => {
  const result = reviewPullRequest({ ...sample(), state: 'merged', mergedAt: 'bad', mergeCommitSha: 'bad', mergedBy: {} });
  assert.equal(result.mergedAt, null);
  assert.equal(result.mergeCommitSha, null);
  assert.equal(result.mergedBy, null);
});

test('une revue complémentaire appartient strictement à la phase sélectionnée et garde son contexte', () => {
  const phase = { id: 2, pullRequest: { ...sample(), number: 6, url: sample().url.replace('/12', '/6'), state: 'merged' } };
  const followUps = [
    { phaseId: 2, result: 'Recadrage ciblé de la Homepage.', documentationPullRequest: { ...sample(), scope: ' Préserver la présentation existante. ' } },
    { phaseId: 3, documentationPullRequest: sample() },
    { phaseId: '2', documentationPullRequest: sample() },
  ];
  const before = structuredClone({ phase, followUps });
  const result = reviewFollowUpPullRequests(followUps, phase);
  assert.equal(result.length, 1);
  assert.equal(result[0].request.number, 12);
  assert.equal(result[0].context, 'Préserver la présentation existante.');
  assert.deepEqual({ phase, followUps }, before);
  assert.equal('validatedOn' in result[0], false);
});

test('les revues complémentaires malformées ou sans phase numérique valide sont ignorées', () => {
  const phase = { id: 2 };
  for (const followUps of [undefined, null, {}, 'invalid']) assert.deepEqual(reviewFollowUpPullRequests(followUps, phase), []);
  for (const phase of [undefined, null, {}, { id: '2' }, { id: -1 }, { id: 2.1 }]) {
    assert.deepEqual(reviewFollowUpPullRequests([{ phaseId: 2, documentationPullRequest: sample() }], phase), []);
  }
  const invalidRequests = [null, {}, { ...sample(), url: 'javascript:alert(1)' }, { ...sample(), repository: 'other/repo' }, { ...sample(), headSha: 'short' }, { ...sample(), observedAt: '2026-02-30T08:00:00Z' }];
  assert.deepEqual(reviewFollowUpPullRequests([
    null, [], {}, ...invalidRequests.map(documentationPullRequest => ({ phaseId: 2, documentationPullRequest })),
  ], phase), []);
});

test('la PR principale et les répétitions des compléments sont dédoublonnées par dépôt et numéro', () => {
  const secondary = { ...sample(), number: 13, url: sample().url.replace('/12', '/13') };
  const anotherRepository = { ...secondary, repository: 'other/repo', url: 'https://github.com/other/repo/pull/13' };
  const result = reviewFollowUpPullRequests([
    { phaseId: 2, documentationPullRequest: sample() },
    { phaseId: 2, result: 'Contexte conservé.', documentationPullRequest: secondary },
    { phaseId: 2, documentationPullRequest: { ...secondary, repository: secondary.repository.toUpperCase(), url: secondary.url.toUpperCase().replace('HTTPS://GITHUB.COM', 'https://github.com') } },
    { phaseId: 2, documentationPullRequest: anotherRepository },
  ], { id: 2, pullRequest: sample() });
  assert.deepEqual(result.map(item => item.request.url), [secondary.url, anotherRepository.url]);
  assert.equal(result[0].context, 'Contexte conservé.');
  assert.equal(result[1].context, 'Complément rattaché à cette phase.');
});

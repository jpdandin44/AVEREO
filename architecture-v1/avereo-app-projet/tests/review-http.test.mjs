import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createReviewStore } from '../workflows/review-store.mjs';
import { createReviewMiddleware } from '../workflows/review-http.mjs';
import { demoState, demoDocument } from '../workflows/review-fixture.mjs';

async function serverFixture(t, disconnected = false) {
  const root = await mkdtemp(join(tmpdir(), 'avereo-review-http-'));
  await writeFile(join(root, 'suivi-chantier.json'), JSON.stringify(demoState()));
  await writeFile(join(root, 'audit-demo.md'), demoDocument);
  const store = await createReviewStore(root);
  const middleware = createReviewMiddleware(disconnected ? undefined : store);
  const server = createServer((req, res) => middleware(req, res, () => { res.writeHead(404); res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const port = server.address().port;
  const call = (path, { method = 'GET', headers = {}, body } = {}) => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path: `/local-review/${path}`, method, headers }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject); req.end(body);
  });
  return { store, call, port };
}

test('HTTP : lecture, document, écriture autorisée, journal et export du même suivi', async t => {
  const { call, port } = await serverFixture(t);
  const state = await call('state');
  assert.equal(state.status, 200); assert.equal(state.headers['cache-control'], 'no-store');
  const view = JSON.parse(state.text);
  assert.equal((await call('document?path=audit-demo.md')).status, 200);
  assert.equal((await call('document?path=..%2Fsecret.md')).status, 404);
  const input = { phaseId: 0, action: 'comment', revision: view.revision, reviewer: 'Test HTTP', comment: 'Observation fictive de recette.', confirm: true };
  const result = await call('actions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Review-Token': view.token, Origin: `http://127.0.0.1:${port}` }, body: JSON.stringify(input) });
  assert.equal(result.status, 200);
  const exported = await call('export');
  assert.match(exported.headers['content-disposition'], /attachment/);
  assert.equal(JSON.parse(exported.text).reviewEvents.length, 1);
});

test('HTTP : origines tierces, faux Host et jeton manquant ou faux sont refusés', async t => {
  const { call, store } = await serverFixture(t);
  assert.equal((await call('state', { headers: { Host: 'evil.example:5190' } })).status, 403);
  assert.equal((await call('state', { headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await call('state', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  assert.equal((await call('state', { headers: { 'Sec-Fetch-Site': 'same-site' } })).status, 403);
  for (const token of ['', 'invalid']) assert.equal((await call('actions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Review-Token': token }, body: '{}' })).status, 403);
  assert.equal((await store.snapshot()).data.reviewEvents, undefined);
});

test('HTTP : corps invalide, mauvais type, volume excessif et route inconnue', async t => {
  const { call } = await serverFixture(t);
  const { token } = JSON.parse((await call('state')).text);
  const headers = { 'Content-Type': 'application/json', 'X-Review-Token': token };
  assert.equal((await call('actions', { method: 'POST', headers, body: 'null' })).status, 400);
  assert.equal((await call('actions', { method: 'POST', headers, body: '{' })).status, 400);
  assert.equal((await call('actions', { method: 'POST', headers: { ...headers, 'Content-Type': 'text/plain' }, body: '{}' })).status, 415);
  assert.equal((await call('actions', { method: 'POST', headers, body: JSON.stringify({ large: 'x'.repeat(70000) }) })).status, 413);
  assert.equal((await call('unknown')).status, 404);
});

test('HTTP : un dossier absent produit une indisponibilité explicite', async t => {
  const { call } = await serverFixture(t, true);
  const response = await call('state');
  assert.equal(response.status, 503);
  assert.match(response.text, /Aucun chantier/);
});

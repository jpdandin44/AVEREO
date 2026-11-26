import test from 'node:test';
import assert from 'node:assert/strict';
import { canReportAction, sameAccount, administeredMissionDefault } from './profileAccess.js';
import { saveAs, setDownloadAuthorization } from './saveAs.js';
import { authorizeProjectTransfer } from './services/reportApi.js';

test('Projet rechecks authorization after the ordinary export gate, before any file URL is created', async () => {
  const previousDocument = globalThis.document, create = URL.createObjectURL, revoke = URL.revokeObjectURL;
  const sequence = []; let created = 0;
  URL.createObjectURL = () => { created++; return 'blob:project'; };URL.revokeObjectURL = () => {};
  globalThis.document = { createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } };
  const dispose = setDownloadAuthorization(async () => { sequence.push('report'); return true; });
  try {
    const result = await saveAs(new Blob(['project']), 'project.json', { authorize: async () => { sequence.push('project'); return false; } });
    assert.equal(result, false);assert.equal(created, 0);assert.deepEqual(sequence, ['report', 'project']);
    assert.equal(await saveAs(new Blob(['project']), 'project.json', { authorize: async () => true }), true);assert.equal(created, 1);
  } finally { dispose();globalThis.document = previousDocument;URL.createObjectURL = create;URL.revokeObjectURL = revoke; }
});

test('Projet transfer uses the current server account and propagates withdrawal without sending the dossier', async t => {
  const user = { id: '42', provider: 'avereo_connect' };let response = { ok: true, provider: 'avereo_connect', accountId: '42' };let status = 200;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/auth.php?action=authorize-project-transfer');assert.equal(options.method, 'POST');assert.equal(options.credentials, 'same-origin');assert.equal(options.body, '{}');
    return new Response(JSON.stringify(response), { status, headers: { 'Content-Type': 'application/json' } });
  });
  assert.equal(await authorizeProjectTransfer('', user), true);
  response.accountId = '43';await assert.rejects(authorizeProjectTransfer('', user), /compte a changé/);
  status = 403;response = { ok: false, message: 'Projet retiré' };await assert.rejects(authorizeProjectTransfer('', user), /Projet retiré/);
});

test('managed actions are separate from profession and legacy roles', () => {
  assert.equal(canReportAction({ profil_metier: 'architecte' }, 'update'), true);
  const user = { profileAccess: { managed: true, actions: ['read', 'export'] } };
  assert.equal(canReportAction(user, 'read'), true);
  assert.equal(canReportAction(user, 'export'), true);
  assert.equal(canReportAction(user, 'create'), false);
  assert.equal(canReportAction({ profileAccess: { managed: true } }, 'update'), false);
  assert.equal(sameAccount({ id: 2, provider: 'avereo_connect' }, { id: '2', provider: 'avereo_connect' }), true);
  assert.equal(sameAccount({ id: 2, provider: 'avereo_connect' }, { id: 3, provider: 'avereo_connect' }), false);
});

test('only a template bound to the authenticated managed account supplies an administrative default', () => {
  const user = { id: '2', provider: 'avereo_connect', profileAccess: { managed: true,
    profile: { id: 'p_custom', name: 'Conseiller rénovation', template: 'habitologue' }, actions: ['read'] } };
  assert.equal(administeredMissionDefault(user).profile, 'habitologue');
  assert.match(administeredMissionDefault(user).notice, /Conseiller rénovation/);
  assert.equal(canReportAction(user, 'create'), false);
  assert.equal(administeredMissionDefault({ ...user, provider: 'drupal' }), null);
  assert.equal(administeredMissionDefault({ ...user, profileAccess: { managed: true, profile: { template: 'unknown' } } }), null);
});

test('all official downloads await current authorization before creating a file URL', async () => {
  const previousDocument = globalThis.document;
  const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
  let created = 0, clicked = 0, revoked = 0;
  URL.createObjectURL = () => { created++; return 'blob:test'; };
  URL.revokeObjectURL = () => { revoked++; };
  globalThis.document = { createElement: () => ({ click() { clicked++; }, remove() {} }), body: { appendChild() {} } };
  let finish;
  const dispose = setDownloadAuthorization(() => new Promise(resolve => { finish = resolve; }));
  try {
    const pending = saveAs(new Blob(['private report']), 'rapport.json');
    assert.equal(created, 0); assert.equal(clicked, 0);
    finish(false); assert.equal(await pending, false); assert.equal(created, 0);
    const next = setDownloadAuthorization(async () => true);
    dispose(); // An old component must not remove the replacement account's guard.
    assert.equal(await saveAs(new Blob(['allowed']), 'rapport.docx'), true);
    assert.equal(clicked, 1); assert.equal(revoked, 1);
    next();
    assert.equal(await saveAs(new Blob(['offline']), 'offline.json'), true);
  } finally {
    dispose(); globalThis.document = previousDocument; URL.createObjectURL = create; URL.revokeObjectURL = revoke;
  }
});

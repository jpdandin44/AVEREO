import test from 'node:test';
import assert from 'node:assert/strict';
import { verifierPromotion } from './verifier-promotion.mjs';

const sha = 'a'.repeat(40);
for (const state of ['failure', 'in_progress', 'success']) {
  test(`promotion : état ${state}`, async () => {
    const request = async (url) => Response.json(url.includes('/statuses') ? [{ state }] : [{ id: 1, sha, environment: 'vision-preprod' }]);
    if (state === 'success') await verifierPromotion('test/repo', sha, 'fictif', request);
    else await assert.rejects(verifierPromotion('test/repo', sha, 'fictif', request), /Production refusée/);
  });
}
test('promotion : SHA différent ou environnement incorrect refusé', async () => {
  for (const deployment of [{ sha: 'b'.repeat(40), environment: 'vision-preprod' }, { sha, environment: 'vision' }]) {
    await assert.rejects(verifierPromotion('test/repo', sha, 'fictif', async () => Response.json([deployment])), /Production refusée/);
  }
});
test('promotion : historique de succès accepté après inactivation', async () => {
  await verifierPromotion('test/repo', sha, 'fictif', async (url) => Response.json(url.includes('/statuses') ? [{ state: 'inactive' }, { state: 'success' }] : [{ id: 1, sha, environment: 'vision-preprod' }]));
});
test('promotion : erreur API bloquante', async () => {
  await assert.rejects(verifierPromotion('test/repo', sha, 'fictif', async () => new Response('', { status: 403 })), /HTTP 403/);
});

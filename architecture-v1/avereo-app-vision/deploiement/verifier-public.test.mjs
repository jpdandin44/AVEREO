import test from 'node:test';
import assert from 'node:assert/strict';
import { verifierPublic } from './verifier-public.mjs';

function simulation(alter = () => {}) {
  return async (url) => {
    const path = new URL(url).pathname;
    const state = { code: 200, headers: {}, body: '' };
    if (url.startsWith('http:')) Object.assign(state, { code: 301, headers: { location: 'https://vision.example/' } });
    else if (path === '/') Object.assign(state, { body: '<div id="root"></div><script src="/assets/index-123.js"></script>', headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY' } });
    else if (path === '/api/health.php') state.body = JSON.stringify({ ok: true, app: 'vision', database: 'up' });
    else if (path === '/api/projects.php') state.code = 401;
    else if (path.startsWith('/api/lib/')) state.code = 403;
    else state.headers = { 'Cache-Control': 'no-cache', 'Content-Type': 'application/manifest+json' };
    alter(url, state);
    return new Response(state.body, { status: state.code, headers: state.headers });
  };
}
test('contrôles publics : réponses conformes', () => verifierPublic('vision.example', simulation()));
for (const [label, alter] of [
  ['bibliothèque accessible', (url, state) => { if (url.endsWith('/api/lib/config.php')) state.code = 200; }],
  ['base indisponible', (url, state) => { if (url.endsWith('/health.php')) state.body = '{"ok":true,"app":"vision","database":"down"}'; }],
  ['cache du service worker', (url, state) => { if (url.endsWith('/sw.js')) state.headers = {}; }],
  ['type du manifeste', (url, state) => { if (url.endsWith('/manifest.webmanifest')) state.headers['Content-Type'] = 'text/html'; }],
  ['en-têtes absents', (url, state) => { if (url === 'https://vision.example/') state.headers = {}; }],
  ['redirection HTTP absente', (url, state) => { if (url.startsWith('http:')) state.code = 200; }],
]) test(`contrôles publics : refus si ${label}`, () => assert.rejects(verifierPublic('vision.example', simulation(alter))));
test('contrôles publics : erreur TLS bloquante', () => assert.rejects(verifierPublic('vision.example', async () => { throw new Error('certificat invalide'); }), /certificat invalide/));

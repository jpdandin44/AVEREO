import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export async function verifierPublic(domain, request = fetch) {
  const base = `https://${domain}`;
  async function get(path, code) {
    const response = await request(base + path, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    if (response.status !== code) throw new Error(`${path} : HTTP ${response.status}, attendu ${code}`);
    return response;
  }
  const page = await get('/', 200);
  const html = await page.text();
  if (!html.includes('<div id="root">') || !/assets\/[^"'\s]+\.js/.test(html)) throw new Error('Page Vite absente.');
  for (const [header, expected] of [['x-content-type-options', 'nosniff'], ['x-frame-options', 'DENY']]) {
    if (page.headers.get(header)?.toLowerCase() !== expected.toLowerCase()) throw new Error(`En-tête absent : ${header}`);
  }
  if (!page.headers.get('referrer-policy')) throw new Error('Referrer-Policy absent.');
  for (const path of ['/sw.js', '/manifest.webmanifest']) {
    const response = await get(path, 200);
    if (!response.headers.get('cache-control')?.toLowerCase().includes('no-cache')) throw new Error(`Cache incorrect : ${path}`);
    if (path.endsWith('webmanifest') && response.headers.get('content-type')?.split(';')[0].trim() !== 'application/manifest+json') throw new Error('Type du manifeste incorrect.');
  }
  const health = await (await get('/api/health.php', 200)).json();
  if (health.ok !== true || health.app !== 'vision' || health.database !== 'up') throw new Error('Santé API incorrecte.');
  await get('/api/projects.php', 401);
  await get('/api/lib/config.php', 403);
  await get('/api/lib/db.php', 403);
  const redirect = await request(`http://${domain}/`, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
  if (![301, 302, 307, 308].includes(redirect.status) || !redirect.headers.get('location')?.startsWith(`${base}/`)) throw new Error('Redirection HTTPS absente.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await verifierPublic(process.argv[2]); console.log('Contrôles publics réussis.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

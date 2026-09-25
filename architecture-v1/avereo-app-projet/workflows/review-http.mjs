import { randomBytes, timingSafeEqual } from 'node:crypto';
import { ReviewError } from './review-store.mjs';

export function createReviewMiddleware(store) {
  const token = randomBytes(32).toString('hex');
  const json = (response, status, body) => {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(JSON.stringify(body));
  };
  return async (request, response, next) => {
    if (!(request.url || '').startsWith('/local-review/')) return next();
    try {
      const address = request.socket.remoteAddress;
      const host = request.headers.host;
      const port = request.socket.localPort;
      if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address) || ![`127.0.0.1:${port}`, `localhost:${port}`].includes(host)) throw new ReviewError(403, 'Accès réservé à la boucle locale.');
      if ((request.headers.origin && request.headers.origin !== `http://${host}`) || ['cross-site', 'same-site'].includes(request.headers['sec-fetch-site'])) throw new ReviewError(403, 'Origine de la requête refusée.');
      if (!store) throw new ReviewError(503, 'Aucun chantier connecté. Utilisez npm run dev:review avec le dossier du chantier.');
      const url = new URL(request.url, `http://${host}`);
      if (request.method === 'GET' && url.pathname === '/local-review/state') return json(response, 200, { ...await store.snapshot(), token });
      if (request.method === 'GET' && url.pathname === '/local-review/document') return json(response, 200, await store.document(url.searchParams.get('path')));
      if (request.method === 'GET' && url.pathname === '/local-review/export') {
        response.setHeader('Content-Disposition', 'attachment; filename="suivi-chantier.json"');
        return json(response, 200, (await store.snapshot()).data);
      }
      if (request.method !== 'POST' || url.pathname !== '/local-review/actions') throw new ReviewError(404, 'Route inconnue.');
      const supplied = Buffer.from(String(request.headers['x-review-token'] || ''));
      const expected = Buffer.from(token);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new ReviewError(403, 'Session de revue expirée. Actualisez la page.');
      if (request.headers['content-type'] !== 'application/json') throw new ReviewError(415, 'Le corps doit être au format JSON.');
      let size = 0;
      const chunks = [];
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 65536) throw new ReviewError(413, 'Décision trop volumineuse.');
        chunks.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw new ReviewError(400, 'Corps JSON invalide.'); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ReviewError(400, 'Décision invalide.');
      json(response, 200, { ...await store.act(input), token });
    } catch (error) {
      json(response, error.status || 500, { error: error.status ? error.message : 'Lecture ou enregistrement impossible. Vérifiez les fichiers et leurs droits ; aucune réussite n’est attestée.' });
    }
  };
}

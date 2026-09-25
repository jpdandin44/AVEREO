import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Les données de travail sont servies uniquement en développement, jamais copiées dans dist.
const localPlanning = {
  name: 'projet-local-planning',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const filename = {
        '/local-planning/planning-pilote.csv': 'planning-pilote.csv',
        '/local-planning/planning-pilote.json': 'planning-pilote.json',
        '/local-planning/pilotage-etapes.md': '../../docs/pilotage-etapes.md',
      }[(request.url || '').split('?')[0]];
      if (!filename) return next();
      try {
        const content = await readFile(fileURLToPath(new URL(`../data/generated/${filename}`, import.meta.url)));
        response.setHeader('Content-Type', filename.endsWith('.json') ? 'application/json; charset=utf-8' : filename.endsWith('.md') ? 'text/plain; charset=utf-8' : 'text/csv; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(content);
      } catch (_) {
        response.statusCode = 404;
        response.end('Planning local indisponible.');
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), localPlanning],
  server: { host: '127.0.0.1', port: 5186, strictPort: true },
});

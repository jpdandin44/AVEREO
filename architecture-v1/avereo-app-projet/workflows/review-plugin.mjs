import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { createReviewStore } from './review-store.mjs';
import { createReviewMiddleware } from './review-http.mjs';

const exec = promisify(execFile);
export function localReviewPlugin() {
  return {
    name: 'projet-local-review',
    async configureServer(server) {
      let store;
      if (process.env.AVEREO_REVIEW_ROOT) {
        store = await createReviewStore(process.env.AVEREO_REVIEW_ROOT, {
          demo: process.env.AVEREO_REVIEW_DEMO === '1',
          async refreshViews() {
            if (process.env.AVEREO_REVIEW_DEMO === '1') return { status: 'not_applicable' };
            await exec(process.env.AVEREO_PYTHON || 'python', [join(process.env.AVEREO_REVIEW_ROOT, 'actualiser-tableau-de-bord.py')], { windowsHide: true, timeout: 15000 });
            return { status: 'updated' };
          },
        });
        await store.snapshot();
      }
      server.middlewares.use(createReviewMiddleware(store));
    },
  };
}

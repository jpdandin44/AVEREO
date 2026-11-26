import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function verifierPromotion(repository, sha, token, request = fetch) {
  async function list(path) {
    const rows = [];
    for (let page = 1; ; page++) {
      const response = await request(`https://api.github.com/repos/${repository}/${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error(`Contrôle de préproduction impossible : HTTP ${response.status}`);
      const batch = await response.json();
      if (!Array.isArray(batch)) throw new Error('Réponse GitHub inattendue.');
      rows.push(...batch);
      if (batch.length < 100) return rows;
    }
  }
  const deployments = await list(`deployments?environment=vision-preprod&sha=${encodeURIComponent(sha)}`);
  for (const deployment of deployments) {
    if (deployment.sha !== sha || deployment.environment !== 'vision-preprod') continue;
    const statuses = await list(`deployments/${deployment.id}/statuses`);
    if (statuses.some((status) => status.state === 'success')) return;
  }
  throw new Error('Production refusée : ce même commit doit avoir été déployé avec succès en préproduction (vision-preprod).');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await verifierPromotion(process.env.GITHUB_REPOSITORY, process.env.GITHUB_SHA, process.env.GH_TOKEN); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

// Presentation only: the connected JSON is a dated record, not a GitHub query.
const labels = { open: 'Ouverte', merged: 'Fusionnée', closed: 'Fermée sans fusion' };
const sha = value => typeof value === 'string' && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value) ? value : null;

function recordedDate(value) {
  if (typeof value !== 'string') return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts) return null;
  const [, year, month, day, hour, minute, second] = parts.map((value, index) => index > 0 && index < 7 ? Number(value) : value);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() || hour > 23 || minute > 59 || second > 59) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function reviewPullRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { url, repository, number, state } = value;
  if (typeof url !== 'string' || typeof repository !== 'string' || !/^[a-z0-9-]+\/[a-z0-9_.-]+$/i.test(repository) || !Number.isSafeInteger(number) || number < 1 || !Object.hasOwn(labels, state)) return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'github.com' || parsed.port || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
  if (parsed.pathname.toLowerCase() !== `/${repository}/pull/${number}`.toLowerCase()) return null;
  const headSha = sha(value.headSha);
  const observedAt = recordedDate(value.observedAt);
  if (!headSha || !observedAt) return null;
  return {
    url: parsed.href, repository, number, state, label: labels[state], headSha, observedAt,
    mergedAt: state === 'merged' ? recordedDate(value.mergedAt) : null,
    mergeCommitSha: state === 'merged' ? sha(value.mergeCommitSha) : null,
    mergedBy: state === 'merged' && typeof value.mergedBy === 'string' && value.mergedBy.trim().length <= 100 ? value.mergedBy.trim() || null : null,
  };
}

export function reviewFollowUpPullRequests(followUps, phase) {
  if (!Array.isArray(followUps) || !Number.isSafeInteger(phase?.id) || phase.id < 0) return [];
  const requestKey = request => `${request.repository.toLowerCase()}#${request.number}`;
  const primary = reviewPullRequest(phase.pullRequest);
  const seen = new Set(primary ? [requestKey(primary)] : []);
  const requests = [];
  for (const followUp of followUps) {
    if (!followUp || Array.isArray(followUp) || followUp.phaseId !== phase.id) continue;
    const request = reviewPullRequest(followUp.documentationPullRequest);
    if (!request || seen.has(requestKey(request))) continue;
    seen.add(requestKey(request));
    const context = [followUp.documentationPullRequest.scope, followUp.result]
      .find(value => typeof value === 'string' && value.trim());
    requests.push({ request, context: context?.trim() || 'Complément rattaché à cette phase.' });
  }
  return requests;
}

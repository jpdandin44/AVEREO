// Both stores can contain a draft after a temporary IndexedDB failure.
export function latestDraft(candidates) {
  return candidates.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .reduce((latest, item) => !latest || (Date.parse(item.updatedAt) || 0) > (Date.parse(latest.updatedAt) || 0)
      ? item : latest, null);
}

import limits from './report-volumes.json' with { type: 'json' };

export const REPORT_JSON_LIMIT = limits.reportJsonBytes;
export const PUBLICATION_LIMIT = limits.publicationBytes;
export const DOCUMENT_FILE_LIMIT = limits.documentFileBytes;
export const DOCUMENT_BATCH_LIMIT = limits.documentBatchBytes;

// Mo is decimal. Keep the exact existing binary threshold visible when applicable.
export function volumeLabel(bytes) {
  const mo = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(bytes / 1000000);
  return `${mo} Mo${bytes % (1024 * 1024) === 0 ? ` (${bytes / (1024 * 1024)} Mio)` : ''}`;
}
export const REPORT_LIMIT_LABEL = volumeLabel(REPORT_JSON_LIMIT);
export const PUBLICATION_LIMIT_LABEL = volumeLabel(PUBLICATION_LIMIT);

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function requireReportContent(value) {
  if (!object(value) || !Array.isArray(value.observations)
    || value.observations.some(observation => !object(observation)
      || (observation.photos != null && !Array.isArray(observation.photos)))) {
    throw new Error('Ce fichier ne contient pas le dossier complet. Un résumé ou un horodatage ne suffit pas. Le brouillon actuel est conservé.');
  }
  return value;
}

export function isTestStructure(report) {
  return report?.copie_test === true || (report?.titre === 'Copie pour les tests'
    && report?.proprietaire === 'Client fictif' && /^TEST-/.test(report?.reference_dossier || '')
    && Array.isArray(report?.observations) && report.observations.every(observation =>
      observation.observations === 'Constat de test' && !(observation.photos || []).length));
}

export function reportContentSummary(report) {
  requireReportContent(report);
  return {
    observations: report.observations.length,
    photos: report.observations.reduce((count, observation) => count + (observation.photos?.length || 0), 0),
    plans: Array.isArray(report.plans) ? report.plans.length : 0,
    signature: Boolean(report.signature),
    structureOnly: isTestStructure(report),
  };
}

export function readReportFile(text) {
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('Fichier JSON illisible. Le brouillon actuel est conservé.'); }
  // Accept the existing API response envelope as well as a raw report export.
  const report = object(parsed) && object(parsed.report) && object(parsed.report.payload)
    ? parsed.report.payload : parsed;
  return requireReportContent(report);
}

export function independentReport(report) {
  requireReportContent(report);
  requireEditableNumbers(report);
  const copy = structuredClone(report);
  // Keep business IDs and references within the report, but never target the
  // source's server row when a recipient saves this imported file.
  delete copy.onlineReportId;
  return copy;
}

export function requireEditableNumbers(value) {
  if (typeof value === 'number' && Number.isInteger(value) && !Number.isSafeInteger(value)) {
    throw new Error('Ce dossier contient un entier trop grand pour être modifié sans perte dans ce navigateur. Conservez le JSON complet téléchargé ; le brouillon actuel est conservé.');
  }
  if (value && typeof value === 'object') Object.values(value).forEach(requireEditableNumbers);
  return value;
}

export async function verifyCompleteDownload(response) {
  if (!response.ok || !response.headers.get('Content-Disposition')?.startsWith('attachment;')) {
    throw new Error('Téléchargement refusé ou session expirée. Relancez Rapport depuis CONNECT.');
  }
  const blob = await response.blob();
  const expected = response.headers.get('X-Avereo-Payload-Sha256');
  if (!/^[a-f0-9]{64}$/.test(expected || '')) throw new Error('Le téléchargement complet n’a pas pu être vérifié.');
  const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  const actual = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  if (actual !== expected) throw new Error('Le fichier reçu diffère du dossier sauvegardé. Réessayez le téléchargement.');
  const content = readReportFile(await blob.text());
  return { blob, summary: reportContentSummary(content) };
}

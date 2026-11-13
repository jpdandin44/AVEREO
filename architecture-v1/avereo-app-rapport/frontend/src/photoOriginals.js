const ID = /^[a-f0-9]{32}$/;
const SHA = /^[a-f0-9]{64}$/;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const API = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export function originalReference(photo, reportId) {
  const value = photo?.original;
  return ID.test(reportId || '') && value && ID.test(value.id || '')
    && value.reportId === reportId && SHA.test(value.sha256 || '')
    && Number.isSafeInteger(value.bytes) && value.bytes > 0 && TYPES.includes(value.mime)
    ? value : null;
}

export function originalDownloadName(original) {
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[original.mime];
  const base = String(original.name || 'photo').split(/[\\/]/).at(-1)
    .replace(/[\u0000-\u001f\u007f]/g, '').replace(/\.[^.]*$/, '').replace(/^[. ]+|[. ]+$/g, '') || 'photo';
  return `${base}.${extension || 'bin'}`;
}

export function attachOriginal(report, target, original) {
  if (report.onlineReportId !== target.reportId || !originalReference({ original }, target.reportId)) return report;
  let changed = false;
  const observations = report.observations.map(observation => {
    if (observation.id !== target.observationId) return observation;
    const photos = observation.photos.map(photo => {
      if (photo.id !== target.photoId || photo.src !== target.src) return photo;
      changed = true;
      return { ...photo, original };
    });
    return changed ? { ...observation, photos } : observation;
  });
  return changed ? { ...report, observations } : report;
}

export function photoBlob(photo) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(photo?.src || '');
  if (!match) throw new Error('La conservation privée prend en charge les photos JPEG, PNG et WebP. La photo locale est conservée.');
  let bytes;
  try { bytes = Uint8Array.from(atob(match[2]), char => char.charCodeAt(0)); }
  catch { throw new Error('La photo locale est illisible. Aucun original envoyé.'); }
  if (!bytes.length) throw new Error('La photo est vide.');
  return new Blob([bytes], { type: match[1] });
}

export async function blobSha256(blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function checkedResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const authenticationRequired = response.status === 401 || (response.status === 403
      && !['origin_refused', 'photo_header_required'].includes(body?.error));
    const error = new Error(authenticationRequired
      ? 'Relancez Rapport depuis CONNECT pour vérifier votre accès. La photo locale est conservée.'
      : body?.message || 'Original privé indisponible. La photo locale est conservée.');
    error.status = response.status;
    throw error;
  }
  return response;
}

export async function photoOriginalCapabilities({ signal, fetchImpl = fetch } = {}) {
  const response = await checkedResponse(await fetchImpl(`${API}/photo-originals.php?action=capabilities`, {
    credentials: 'same-origin', redirect: 'error', signal, headers: { Accept: 'application/json' },
  }));
  const data = await response.json();
  if (!data?.ok) throw new Error('Conservation privée indisponible.');
  return data;
}

export async function preservePhotoOriginal(reportId, photo, { signal, maxBytes, fetchImpl = fetch } = {}) {
  if (!ID.test(reportId || '')) throw new Error('Sauvez d’abord le dossier en ligne.');
  const blob = photoBlob(photo);
  if (maxBytes && blob.size > maxBytes) throw new Error('La photo dépasse la taille acceptée pour la conservation privée. Elle reste disponible localement.');
  const sha256 = await blobSha256(blob);
  if (signal?.aborted) throw new DOMException('Envoi annulé', 'AbortError');
  const body = new FormData();
  body.append('reportId', reportId);
  body.append('sha256', sha256);
  body.append('file', blob, photo.name || 'photo');
  const response = await checkedResponse(await fetchImpl(`${API}/photo-originals.php`, {
    method: 'POST', body, signal, credentials: 'same-origin', redirect: 'error',
    headers: { Accept: 'application/json', 'X-Avereo-Photo': '1' },
  }));
  const data = await response.json();
  const original = originalReference({ original: data?.original }, reportId);
  if (!data?.ok || !original || original.sha256 !== sha256 || original.bytes !== blob.size || original.mime !== blob.type) {
    throw new Error('La conservation de l’original n’a pas pu être confirmée. La photo locale est conservée.');
  }
  if (signal?.aborted) throw new DOMException('Envoi annulé', 'AbortError');
  return original;
}

export async function readPhotoOriginal(reportId, photo, { signal, fetchImpl = fetch } = {}) {
  const original = originalReference(photo, reportId);
  if (!original) throw new Error('Cette photo ne référence pas un original de ce dossier.');
  const params = new URLSearchParams({ reportId, id: original.id });
  const response = await checkedResponse(await fetchImpl(`${API}/photo-originals.php?${params}`, {
    signal, credentials: 'same-origin', redirect: 'error',
  }));
  const blob = await response.blob();
  if (blob.size !== original.bytes || blob.type !== original.mime || await blobSha256(blob) !== original.sha256) {
    throw new Error('Le fichier reçu ne correspond pas à l’original conservé.');
  }
  if (signal?.aborted) throw new DOMException('Lecture annulée', 'AbortError');
  return blob;
}

import JSZip from 'jszip';
import { independentReport, readReportFile, requireEditableNumbers } from './reportFiles.js';
import { blobSha256, originalReference, readPhotoOriginal } from './photoOriginals.js';

export const PUBLICATION_LIMIT = 500 * 1024 * 1024;
const JSON_LIMIT = 50 * 1024 * 1024;
const SCHEMA = 'avereo-rapport-publication';
const PATH = /^(?:dossier-rapport\.json|rapport-client\.docx|originaux\/[a-f0-9]{32}\.(?:jpg|png|webp))$/;
const fail = () => { throw new Error('Copie Rapport incomplète ou altérée. Le brouillon actuel est conservé.'); };

export async function createPublication(report, clientWord, { validated, readOriginal = readPhotoOriginal, id = crypto.randomUUID().replaceAll('-', ''), now = new Date().toISOString() } = {}) {
  if (validated !== true) throw new Error('Confirmez la relecture professionnelle avant de préparer la publication.');
  requireEditableNumbers(report);
  readReportFile(JSON.stringify(report));
  if (!(clientWord instanceof Blob) || !clientWord.size) throw new Error('La restitution client est absente.');
  const files = new Map([
    ['dossier-rapport.json', new Blob([JSON.stringify(report)], { type: 'application/json' })],
    ['rapport-client.docx', clientWord],
  ]);
  if (files.get('dossier-rapport.json').size > JSON_LIMIT) throw new Error('La copie JSON dépasse 50 Mio.');
  const originals = [];
  for (const [observationIndex, observation] of report.observations.entries()) {
    for (const [photoIndex, photo] of (observation.photos || []).entries()) {
      if (!photo.original) continue;
      const original = originalReference(photo, report.onlineReportId);
      if (!original) throw new Error('Un original photo est rattaché à un autre dossier. Rouvrez le dossier source autorisé pour préparer sa copie complète.');
      const path = `originaux/${original.id}.${{ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[original.mime]}`;
      if (!files.has(path)) files.set(path, await readOriginal(report.onlineReportId, photo));
      const blob = files.get(path);
      if (blob.size !== original.bytes || await blobSha256(blob) !== original.sha256) fail();
      originals.push({ observationIndex, photoIndex, path, mime: original.mime });
    }
  }
  if (files.size > 2000 || [...files.values()].reduce((n, b) => n + b.size, 0) > PUBLICATION_LIMIT - 1024 * 1024) throw new Error('Cette publication dépasse 500 Mo.');
  const entries = [];
  const zip = new JSZip();
  for (const [path, blob] of files) {
    entries.push({ path, bytes: blob.size, sha256: await blobSha256(blob) });
    zip.file(path, await blob.arrayBuffer(), { createFolders: false });
  }
  const manifest = { schema: SCHEMA, version: 1, id, createdAt: now, title: String(report.titre || 'Rapport finalisé').slice(0, 200), reference: String(report.reference_dossier || '').slice(0, 200), validatedByProfessional: true, entries, originals };
  zip.file('manifest.json', JSON.stringify(manifest));
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
  if (bytes.length > PUBLICATION_LIMIT) throw new Error('Cette publication dépasse 500 Mo.');
  return { blob: new Blob([bytes], { type: 'application/zip' }), manifest };
}

// Packages use stored entries only. Validate central sizes before reading any
// payload: compressed/unbounded imports are never expanded in the browser.
function inspectDirectory(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break; }
  }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) fail();
  const count = view.getUint16(end + 10, true), start = view.getUint32(end + 16, true);
  if (count < 3 || count > 2001 || view.getUint16(end + 8, true) !== count || start + view.getUint32(end + 12, true) !== end) fail();
  const names = new Set(); let cursor = start, total = 0;
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > end || view.getUint32(cursor, true) !== 0x02014b50) fail();
    const size = view.getUint32(cursor + 24, true), length = view.getUint16(cursor + 28, true);
    const next = cursor + 46 + length + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
    if (next > end || view.getUint16(cursor + 8, true) & 1 || view.getUint16(cursor + 10, true) !== 0 || view.getUint32(cursor + 20, true) !== size) fail();
    const name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(cursor + 46, cursor + 46 + length));
    if (names.has(name) || (name !== 'manifest.json' && !PATH.test(name)) || (name === 'manifest.json' && size > 65536) || (name === 'dossier-rapport.json' && size > JSON_LIMIT)) fail();
    names.add(name); total += size; cursor = next;
  }
  if (cursor !== end || total > PUBLICATION_LIMIT) fail();
  return names;
}

export async function readPublication(file) {
  if (file.size > PUBLICATION_LIMIT || file.size < 22) fail();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const names = inspectDirectory(bytes);
  const zip = await JSZip.loadAsync(bytes);
  if (Object.keys(zip.files).length !== names.size) fail();
  let manifest;
  try { manifest = JSON.parse(await zip.file('manifest.json').async('string')); } catch { fail(); }
  if (manifest?.schema !== SCHEMA || manifest.version !== 1 || !/^[a-f0-9]{32}$/.test(manifest.id || '') || manifest.validatedByProfessional !== true
    || !Array.isArray(manifest.entries) || manifest.entries.length !== names.size - 1 || !Array.isArray(manifest.originals)) fail();
  const content = new Map();
  for (const entry of manifest.entries) {
    if (!PATH.test(entry.path || '') || content.has(entry.path) || !names.has(entry.path) || !Number.isSafeInteger(entry.bytes) || entry.bytes < 1 || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')) fail();
    const blob = new Blob([await zip.file(entry.path).async('uint8array')]);
    if (blob.size !== entry.bytes || await blobSha256(blob) !== entry.sha256) fail();
    content.set(entry.path, blob);
  }
  if (!content.has('dossier-rapport.json') || !content.has('rapport-client.docx')) fail();
  const report = independentReport(readReportFile(await content.get('dossier-rapport.json').text()));
  const mapped = new Set(), referenced = new Set();
  for (const item of manifest.originals) {
    const key = `${item.observationIndex}:${item.photoIndex}`;
    if (!Number.isSafeInteger(item.observationIndex) || !Number.isSafeInteger(item.photoIndex) || mapped.has(key)) fail();
    const photo = report.observations[item.observationIndex]?.photos?.[item.photoIndex];
    const original = photo?.original;
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[item.mime];
    const blob = content.get(item.path);
    if (!photo || !original || !ext || item.path !== `originaux/${original.id}.${ext}` || original.mime !== item.mime || !blob || blob.size !== original.bytes || await blobSha256(blob) !== original.sha256) fail();
    const data = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < data.length; offset += 32768) binary += String.fromCharCode(...data.subarray(offset, offset + 32768));
    photo.src = `data:${item.mime};base64,${btoa(binary)}`;
    delete photo.original;
    mapped.add(key); referenced.add(item.path);
  }
  if (report.observations.some(o => (o.photos || []).some(p => p.original)) || [...content.keys()].some(p => p.startsWith('originaux/') && !referenced.has(p))) fail();
  if (new Blob([JSON.stringify(report)]).size > JSON_LIMIT) throw new Error('La copie réouverte dépasse la limite de 50 Mio de Rapport. Le brouillon est conservé.');
  return report;
}

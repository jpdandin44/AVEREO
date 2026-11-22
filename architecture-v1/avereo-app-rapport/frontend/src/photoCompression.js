// Candidat ISOLÉ et NON ACTIVÉ : aucun import dans l'application. Ne le brancher qu'une fois
// l'original conservé durablement dans l'espace privé du dossier en ligne (docs/photos-originales-et-annotations.md).
// Compression locale des NOUVELLES photos importées depuis un fichier.
// Aucun service externe : décodage et ré-encodage JPEG dans le navigateur.
// Les photos déjà présentes dans un dossier (réouverture, import JSON, caméra) ne passent jamais par ici.

export const PHOTO_COMPRESSION = Object.freeze({
  maxDimension: 2400,
  quality: 0.88,
  minBytes: 1.5 * 1024 * 1024,
  minGain: 0.15,
});

// GIF (animation possible), SVG et formats non décodables partout restent intacts.
const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function shouldCompress(file, options = PHOTO_COMPRESSION) {
  return COMPRESSIBLE_TYPES.includes(file?.type) && file.size > options.minBytes;
}

export function targetDimensions(width, height, maxDimension = PHOTO_COMPRESSION.maxDimension) {
  if (!(width > 0) || !(height > 0)) throw new Error('Dimensions de photo invalides.');
  const ratio = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

export function isWorthKeeping(originalBytes, optimizedBytes, minGain = PHOTO_COMPRESSION.minGain) {
  return optimizedBytes > 0 && optimizedBytes <= originalBytes * (1 - minGain);
}

// Fond blanc explicite : sans lui, la transparence d'un PNG/WebP devient noire en JPEG.
export async function renderOptimizedJpeg(file, options = PHOTO_COMPRESSION) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const { width, height } = targetDimensions(image.naturalWidth, image.naturalHeight, options.maxDimension);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas indisponible.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', options.quality));
    if (!blob) throw new Error('Encodage JPEG impossible.');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Lecture impossible.'));
    reader.readAsDataURL(blob);
  });
}

const defaultDeps = {
  render: renderOptimizedJpeg,
  readDataUrl: readBlobAsDataUrl,
  now: () => new Date().toISOString(),
};

// Retourne { photo, savedBytes, optimizationFailed } ou { failed: true } si même l'original est illisible.
export async function prepareImportedPhoto(file, deps) {
  const { render, readDataUrl, createId, now } = { ...defaultDeps, ...deps };
  let optimized = null;
  let optimizationFailed = false;
  if (shouldCompress(file)) {
    try {
      const blob = await render(file, PHOTO_COMPRESSION);
      if (blob && isWorthKeeping(file.size, blob.size)) optimized = blob;
    } catch {
      optimizationFailed = true;
    }
  }
  try {
    const src = await readDataUrl(optimized || file);
    return {
      photo: { id: createId(), name: file.name, src, horodatageISO: now() },
      savedBytes: optimized ? file.size - optimized.size : 0,
      optimizationFailed,
    };
  } catch {
    return { failed: true };
  }
}

// Traitement séquentiel (mémoire maîtrisée) ; une image en échec n'empêche jamais les autres.
export async function importPhotoFiles(files, deps) {
  const result = { photos: [], optimizedCount: 0, savedBytes: 0, unreadableNames: [], unoptimizedNames: [] };
  for (const file of files) {
    const item = await prepareImportedPhoto(file, deps);
    if (item.failed) { result.unreadableNames.push(file.name); continue; }
    result.photos.push(item.photo);
    if (item.savedBytes > 0) { result.optimizedCount += 1; result.savedBytes += item.savedBytes; }
    if (item.optimizationFailed) result.unoptimizedNames.push(file.name);
  }
  return result;
}

// Ajoute au constat visé du dernier état ; si le constat n'existe plus (suppression, autre dossier),
// le même objet est rendu : aucune photo n'est injectée ailleurs.
export function appendPhotos(report, observationId, photos) {
  if (!photos.length || !report.observations.some((obs) => obs.id === observationId)) return report;
  return {
    ...report,
    observations: report.observations.map((obs) =>
      obs.id === observationId ? { ...obs, photos: [...obs.photos, ...photos] } : obs),
  };
}

const plural = (count, one, many) => `${count} ${count > 1 ? many : one}`;
export const formatMio = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mio`;

export function summarizeImport(result) {
  const message = result.photos.length === 0 ? '' : [
    plural(result.photos.length, 'photo ajoutée', 'photos ajoutées'),
    result.optimizedCount > 0
      ? `${plural(result.optimizedCount, 'optimisée', 'optimisées')}, ${formatMio(result.savedBytes)} économisés`
      : 'sans modification',
  ].join(' · ');
  const errors = [];
  if (result.unreadableNames.length) errors.push(`Photo illisible, non ajoutée : ${result.unreadableNames.join(', ')}.`);
  if (result.unoptimizedNames.length) errors.push(`Optimisation impossible, original conservé : ${result.unoptimizedNames.join(', ')}.`);
  return { message, error: errors.join(' ') };
}

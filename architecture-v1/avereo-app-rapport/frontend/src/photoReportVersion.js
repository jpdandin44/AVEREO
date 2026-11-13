// The original stays in photo.src. This optional copy is chosen explicitly for the report.
export const FULL_PHOTO = Object.freeze({ x: 0, y: 0, width: 1, height: 1 });
export const MAX_ANNOTATIONS = 30;
const finite = n => typeof n === 'number' && Number.isFinite(n);
const unit = n => finite(n) && n >= 0 && n <= 1;
const imageData = src => typeof src === 'string' && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(src);

export function validPhotoOperations(value) {
  const c = value?.crop;
  return c && unit(c.x) && unit(c.y) && finite(c.width) && c.width >= .01 && c.width <= 1
    && finite(c.height) && c.height >= .01 && c.height <= 1 && c.x + c.width <= 1.000001 && c.y + c.height <= 1.000001
    && Array.isArray(value.annotations) && value.annotations.length <= MAX_ANNOTATIONS
    && value.annotations.every(a => a && ['rectangle', 'arrow', 'text'].includes(a.type) && unit(a.x) && unit(a.y)
      && (a.type === 'text' ? typeof a.text === 'string' && a.text.trim().length > 0 && a.text.length <= 200
        : unit(a.x2) && unit(a.y2)));
}

export function photoReportVersion(photo) {
  const v = photo?.reportVersion;
  return typeof photo?.id === 'string' && photo.id.length > 0 && v?.version === 1 && v.sourcePhotoId === photo.id && /^[a-f0-9]{64}$/.test(v.sourceSha256 || '')
    && imageData(v.src) && validPhotoOperations(v.operations) ? v : null;
}

export function reportPhotoSource(photo) {
  return photo?.reportPhotoChoice === 'prepared' && photoReportVersion(photo) ? photo.reportVersion.src : photo?.src;
}

export function applyPhotoReportVersion(report, target, version, choice = 'prepared') {
  if ((report.onlineReportId || '') !== (target.reportId || '')) return report;
  const matching = report.observations.filter(o => o.id === target.observationId);
  if (matching.length !== 1 || matching[0].photos.filter(p => p.id === target.photoId).length !== 1) return report;
  let changed = false;
  const observations = report.observations.map(o => {
    if (o.id !== target.observationId) return o;
    const photos = o.photos.map(photo => {
      if (photo.id !== target.photoId || photo.src !== target.src) return photo;
      if (!['original', 'prepared'].includes(choice) || !photoReportVersion({ ...photo, reportVersion: version })) return photo;
      changed = true;
      return { ...photo, reportVersion: version, reportPhotoChoice: choice };
    });
    return changed ? { ...o, photos } : o;
  });
  return changed ? { ...report, observations } : report;
}

// Coordinates remain relative to the complete original, so cropping never rewrites annotations.
export function cropFromSelection(crop, from, to) {
  const x = Math.min(from.x, to.x), y = Math.min(from.y, to.y);
  const width = Math.abs(to.x - from.x), height = Math.abs(to.y - from.y);
  if (width < .02 || height < .02) return crop;
  return { x: crop.x + x * crop.width, y: crop.y + y * crop.height, width: crop.width * width, height: crop.height * height };
}

export function photoHistoryChange(history, operations) {
  if (!validPhotoOperations(operations)) return history;
  return { past: [...history.past, history.present].slice(-40), present: operations, future: [] };
}
export function photoHistoryUndo(h) {
  return h.past.length ? { past: h.past.slice(0, -1), present: h.past.at(-1), future: [h.present, ...h.future] } : h;
}
export function photoHistoryRedo(h) {
  return h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h;
}

export async function loadPhotoImage(src) {
  if (!imageData(src)) throw new Error('Préparation disponible pour les photos JPEG, PNG et WebP intégrées au dossier.');
  const image = new Image();
  image.src = src;
  await image.decode().catch(() => { throw new Error('La photo ne peut pas être décodée. L’original reste conservé.'); });
  if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) {
    throw new Error('Photo trop grande pour cet éditeur (40 millions de pixels au maximum). L’original reste conservé.');
  }
  return image;
}

export function paintPhotoVersion(canvas, image, operations, maxSide = 1600) {
  if (!validPhotoOperations(operations)) throw new Error('Les modifications de la photo sont invalides.');
  const c = operations.crop, width = image.naturalWidth * c.width, height = image.naturalHeight * c.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, c.x * image.naturalWidth, c.y * image.naturalHeight, width, height, 0, 0, canvas.width, canvas.height);
  const x = v => (v - c.x) / c.width * canvas.width, y = v => (v - c.y) / c.height * canvas.height;
  const line = Math.max(2, Math.min(canvas.width, canvas.height) / 180);
  ctx.strokeStyle = '#d52032'; ctx.lineWidth = line; ctx.lineJoin = 'round';
  for (const a of operations.annotations) {
    if (a.type === 'rectangle') {
      ctx.strokeRect(x(a.x), y(a.y), x(a.x2) - x(a.x), y(a.y2) - y(a.y));
    } else if (a.type === 'arrow') {
      const ax = x(a.x), ay = y(a.y), bx = x(a.x2), by = y(a.y2), angle = Math.atan2(by - ay, bx - ax), head = line * 5;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.moveTo(bx - head * Math.cos(angle - .5), by - head * Math.sin(angle - .5)); ctx.lineTo(bx, by);
      ctx.lineTo(bx - head * Math.cos(angle + .5), by - head * Math.sin(angle + .5)); ctx.stroke();
    } else {
      if (a.x < c.x || a.x > c.x + c.width || a.y < c.y || a.y > c.y + c.height) continue;
      const font = Math.max(12, Math.min(canvas.width, canvas.height) / 28);
      ctx.font = `600 ${font}px Arial`; ctx.textBaseline = 'top';
      const maxWidth = Math.max(1, canvas.width - 12), lines = [];
      for (const paragraph of a.text.split('\n')) {
        let current = '';
        for (const char of paragraph) {
          if (current && ctx.measureText(current + char).width > maxWidth - 12) { lines.push(current); current = ''; }
          current += char;
        }
        lines.push(current);
      }
      const boxWidth = Math.min(maxWidth, Math.max(...lines.map(t => ctx.measureText(t).width)) + 12);
      const boxHeight = lines.length * font * 1.25 + 12;
      const left = Math.max(0, Math.min(x(a.x), canvas.width - boxWidth));
      const top = Math.max(0, Math.min(y(a.y), canvas.height - boxHeight));
      ctx.fillStyle = '#ffffffed'; ctx.fillRect(left, top, boxWidth, boxHeight);
      ctx.fillStyle = '#8c1220';
      lines.forEach((t, i) => ctx.fillText(t, left + 6, top + 6 + i * font * 1.25));
    }
  }
  return canvas;
}

import React, { useEffect, useRef, useState } from 'react';
import { blobSha256, photoBlob } from './photoOriginals.js';
import { FULL_PHOTO, MAX_ANNOTATIONS, photoReportVersion, loadPhotoImage, paintPhotoVersion, cropFromSelection, photoHistoryChange, photoHistoryUndo, photoHistoryRedo } from './photoReportVersion.js';

export default function PhotoReportEditor({ photo, onApply, onClose }) {
  const [history, setHistory] = useState(() => ({ past: [], present: photoReportVersion(photo)?.operations || { crop: { ...FULL_PHOTO }, annotations: [] }, future: [] }));
  const [image, setImage] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [tool, setTool] = useState('rectangle'), [comment, setComment] = useState('');
  const canvas = useRef(null), dialog = useRef(null), close = useRef(null), drag = useRef(null), alive = useRef(true);
  const operations = history.present;
  useEffect(() => {
    const previous = document.activeElement, element = dialog.current;
    element.showModal(); close.current.focus(); alive.current = true;
    loadPhotoImage(photo.src).then(value => { if (alive.current) setImage(value); }).catch(e => { if (alive.current) setError(e.message); });
    return () => { alive.current = false; element.close(); previous?.focus(); };
  }, [photo.src]);
  useEffect(() => { if (image) paintPhotoVersion(canvas.current, image, operations, 1000); }, [image, operations]);
  const commit = next => setHistory(h => photoHistoryChange(h, next));
  const point = e => {
    const rect = canvas.current.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)) };
  };
  const originalPoint = p => ({ x: operations.crop.x + p.x * operations.crop.width, y: operations.crop.y + p.y * operations.crop.height });
  const down = e => {
    if (!image || busy || e.button !== 0 || drag.current) return;
    const p = point(e);
    if (tool === 'text') {
      if (!comment.trim()) { setError('Saisissez un commentaire, puis cliquez sur la photo pour le placer.'); return; }
      if (operations.annotations.length >= MAX_ANNOTATIONS) { setError('30 annotations au maximum par photo.'); return; }
      commit({ ...operations, annotations: [...operations.annotations, { type: 'text', ...originalPoint(p), text: comment.trim() }] }); setError('');
    } else { drag.current = { point: p, pointerId: e.pointerId }; canvas.current.setPointerCapture(e.pointerId); }
  };
  const move = e => {
    if (!drag.current || drag.current.pointerId !== e.pointerId || !image) return;
    paintPhotoVersion(canvas.current, image, operations, 1000);
    const p = point(e), from = drag.current.point, ctx = canvas.current.getContext('2d');
    ctx.strokeStyle = '#1765d1'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.strokeRect(from.x * canvas.current.width, from.y * canvas.current.height, (p.x - from.x) * canvas.current.width, (p.y - from.y) * canvas.current.height);
  };
  const up = e => {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    const from = drag.current.point, to = point(e); drag.current = null;
    if (canvas.current.hasPointerCapture(e.pointerId)) canvas.current.releasePointerCapture(e.pointerId);
    if (tool === 'crop') commit({ ...operations, crop: cropFromSelection(operations.crop, from, to) });
    else if (operations.annotations.length >= MAX_ANNOTATIONS) setError('30 annotations au maximum par photo.');
    else if (Math.hypot(from.x - to.x, from.y - to.y) > .01) {
      const a = originalPoint(from), b = originalPoint(to);
      commit({ ...operations, annotations: [...operations.annotations, { type: tool, ...a, x2: b.x, y2: b.y }] });
    }
    paintPhotoVersion(canvas.current, image, operations, 1000);
  };
  const apply = async () => {
    setBusy(true); setError('');
    try {
      const sourceSha256 = await blobSha256(photoBlob(photo));
      const rendered = paintPhotoVersion(document.createElement('canvas'), image, operations);
      const src = rendered.toDataURL('image/jpeg', .9);
      if (!src.startsWith('data:image/jpeg;base64,')) throw new Error('La copie du rapport ne peut pas être créée.');
      if (alive.current) onApply({ version: 1, sourcePhotoId: photo.id, sourceSha256, operations, src, width: rendered.width, height: rendered.height, preparedAt: new Date().toISOString() });
    } catch (e) { if (alive.current) { setError(e.message); setBusy(false); } }
  };
  return <dialog ref={dialog} className="photo-report-editor" aria-labelledby="photo-editor-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <header className="modal-header"><h2 id="photo-editor-title">Préparer la photo du rapport</h2><button ref={close} type="button" className="button secondary" onClick={onClose}>Annuler et fermer</button></header>
    <p>L’original est conservé. Seule la copie choisie sera utilisée dans le rapport.</p>
    <div className="photo-editor-toolbar">
      <label>Outil <select aria-label="Outil photo" value={tool} disabled={busy} onChange={e => { drag.current = null; setTool(e.target.value); setError(''); }}>
        <option value="crop">Recadrage</option><option value="rectangle">Rectangle</option><option value="arrow">Flèche</option><option value="text">Commentaire</option>
      </select></label>
      <button type="button" className="button secondary" disabled={!history.past.length || busy} onClick={() => setHistory(photoHistoryUndo)}>Annuler la modification</button>
      <button type="button" className="button secondary" disabled={!history.future.length || busy} onClick={() => setHistory(photoHistoryRedo)}>Rétablir la modification</button>
      <button type="button" className="button secondary" disabled={busy} onClick={() => commit({ ...operations, crop: { ...FULL_PHOTO } })}>Tout le cadrage</button>
      <button type="button" className="button secondary" disabled={busy} onClick={() => commit({ crop: { ...FULL_PHOTO }, annotations: [] })}>Repartir de l’original</button>
    </div>
    {tool === 'text' && <label className="photo-editor-comment">Commentaire à placer <textarea aria-label="Commentaire sur la photo" maxLength={200} value={comment} disabled={busy} onChange={e => setComment(e.target.value)} /></label>}
    <p className="muted" id="photo-editor-help">{tool === 'text' ? 'Saisissez le commentaire puis cliquez sur la photo.' : 'Glissez sur la photo pour tracer la zone ou la forme.'} Les modifications restent annulables avant application.</p>
    {error && <p role="alert">{error}</p>}
    {!image && !error && <p role="status">Ouverture de la photo…</p>}
    <div className="photo-editor-canvas"><canvas ref={canvas} aria-label="Photo à préparer" aria-describedby="photo-editor-help" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={e => { if (drag.current?.pointerId !== e.pointerId) return; drag.current = null; if (image) paintPhotoVersion(canvas.current, image, operations, 1000); }} /></div>
    <footer><span>{operations.annotations.length} annotation(s) · Copie JPEG, côté maximal 1 600 pixels</span><button type="button" className="button primary" disabled={!image || busy} onClick={apply}>{busy ? 'Préparation…' : 'Appliquer au rapport'}</button></footer>
  </dialog>;
}

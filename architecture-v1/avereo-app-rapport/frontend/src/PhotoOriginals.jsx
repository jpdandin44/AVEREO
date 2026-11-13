import React, { useEffect, useRef, useState } from 'react';
import { originalDownloadName, originalReference, preservePhotoOriginal, readPhotoOriginal } from './photoOriginals.js';
import { saveAs } from './saveAs.js';

export function PhotoOriginalControls({ photo, reportId, canUseOnline, capabilities, onPreserved, disabled, onTransfer }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState(null);
  const request = useRef(null);
  const reference = originalReference(photo, reportId);

  useEffect(() => {
    setMessage('');
    setBusy(false);
    setView(null);
    return () => request.current?.abort();
  }, [reportId, photo.id, photo.src]);
  useEffect(() => () => { if (view?.objectUrl) URL.revokeObjectURL(view.src); }, [view]);

  const preserve = async () => {
    onTransfer(1);
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setMessage('Envoi de l’original…');
    try {
      const original = await preservePhotoOriginal(reportId, photo, { signal: controller.signal, maxBytes: capabilities?.maxOriginalBytes });
      if (!controller.signal.aborted) {
        onPreserved(original);
        setMessage('Original conservé dans l’espace privé. Sauvez le dossier en ligne pour conserver son lien.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setMessage(error.message);
    } finally {
      onTransfer(-1);
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  const openPrivate = async () => {
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setMessage('Lecture de l’original privé…');
    try {
      const blob = await readPhotoOriginal(reportId, photo, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setView({ src: URL.createObjectURL(blob), blob, objectUrl: true, name: originalDownloadName(reference) });
        setMessage('Original privé vérifié, identique au fichier conservé.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setMessage(error.message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  const uploadAvailable = canUseOnline && /^[a-f0-9]{32}$/.test(reportId || '') && capabilities?.enabled;
  return <div className="photo-original-controls">
    <button type="button" className="button secondary" onClick={() => setView({ src: photo.src, name: photo.name })}>Voir la photo</button>
    {uploadAvailable && !reference && <button type="button" className="button secondary" disabled={busy || disabled} onClick={preserve}>
      Conserver l’original en ligne
    </button>}
    {reference && canUseOnline && <button type="button" className="button secondary" disabled={busy} onClick={openPrivate}>Ouvrir l’original privé</button>}
    {message && <p role="status">{message}</p>}
    {view && <PhotoViewer view={view} onClose={() => setView(null)} />}
  </div>;
}

function PhotoViewer({ view, onClose }) {
  const [zoom, setZoom] = useState(100);
  const [imageSize, setImageSize] = useState(null);
  const [box, setBox] = useState(null);
  const [imageError, setImageError] = useState(false);
  const closeButton = useRef(null);
  const dialog = useRef(null);
  const viewport = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    closeButton.current?.focus();
    const observer = new ResizeObserver(() => setBox({ width: viewport.current.clientWidth - 24, height: viewport.current.clientHeight - 24 }));
    observer.observe(viewport.current);
    return () => { observer.disconnect(); element.close(); previous?.focus(); };
  }, []);
  const fit = imageSize && box ? Math.min(box.width / imageSize.width, box.height / imageSize.height, 1) : null;
  return <dialog ref={dialog} className="photo-viewer" aria-label="Détail de la photo" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="modal-card">
      <div className="modal-header"><h2>{view.name || 'Détail de la photo'}</h2><button ref={closeButton} type="button" className="button secondary" onClick={onClose}>Fermer la photo</button></div>
      <div className="photo-viewer-tools">
        <label>Zoom <input aria-label="Zoom de la photo" type="range" min="25" max="400" step="25" value={zoom} onChange={event => setZoom(Number(event.target.value))} /> {zoom} %</label>
        <button type="button" className="button secondary" onClick={() => setZoom(100)}>Ajuster à la fenêtre</button>
        {view.blob && <button type="button" className="button secondary" onClick={() => saveAs(view.blob, view.name || 'photo-originale')}>Télécharger l’original</button>}
      </div>
      <div ref={viewport} className="photo-viewer-image">
        {imageError && <p role="alert">Cette photo ne peut pas être affichée dans ce navigateur. Le fichier du dossier est conservé.</p>}
        <img src={view.src} alt={view.name || 'Photo agrandie'} onError={() => setImageError(true)}
        onLoad={event => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
        style={{ width: fit ? `${imageSize.width * fit * zoom / 100}px` : '100%' }} /></div>
    </div>
  </dialog>;
}

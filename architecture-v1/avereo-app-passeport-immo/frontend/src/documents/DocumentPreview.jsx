import React, { useEffect, useRef, useState } from 'react';
import PdfPreview from './PdfPreview.jsx';
import { CATEGORIES, isCompressedArchive } from './document-store.js';

export default function DocumentPreview({ document, bienId, repository, onOpen, onClose }) {
  const [url, setUrl] = useState(''), [error, setError] = useState('');
  const root = useRef();
  useEffect(() => {
    if (!document || !window.matchMedia?.('(max-width: 1200px)').matches) return;
    const previous = window.document.activeElement;
    root.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, [document?.id]);
  const previewable = document && (document.mime === 'application/pdf' || document.mime.startsWith('image/'));
  useEffect(() => {
    if (!previewable) return;
    let active = true, objectUrl;
    repository.getFile(bienId, document.id).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [bienId, document?.id, previewable, repository]);
  return <aside ref={root} tabIndex={-1} className="document-preview" aria-label="Aperçu du document">
    <header><p className="doc-eyebrow">APERÇU</p>{document && <button className="doc-text" onClick={onClose}>Fermer l’aperçu</button>}</header>
    {!document ? <div className="document-preview-empty"><span aria-hidden="true">▤</span><h3>Un document à portée de main</h3><p>Sélectionnez son titre dans la liste pour afficher l’aperçu et ses informations.</p></div> : <>
      <h3>{document.title}</h3><p className="document-source-name">{document.name}</p>
      <dl><div><dt>Catégorie</dt><dd>{CATEGORIES[document.category]}</dd></div><div><dt>Taille</dt><dd>{document.size < 1000000 ? `${Math.ceil(document.size / 1000)} Ko` : `${(document.size / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} Mo`}</dd></div></dl>
      {error ? <p role="alert" className="doc-error">{error}</p> : previewable ? !url ? <p role="status">Chargement de l’aperçu…</p> : <div className="document-preview-content">{document.mime === 'application/pdf' ? <PdfPreview url={url} title={document.title} /> : <img src={url} alt={document.title} />}</div> : <div className="document-no-preview"><p>{isCompressedArchive(document) ? 'Archive conservée entière, sans extraction.' : 'Ce format se consulte avec votre logiciel habituel.'}</p><p>Ouvrez le document pour télécharger sa copie.</p></div>}
      <button className="doc-primary" onClick={() => onOpen(document)}>Ouvrir en grand / télécharger</button>
    </>}
  </aside>;
}

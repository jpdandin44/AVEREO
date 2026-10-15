import React, { useEffect, useRef, useState } from 'react';
import { CATEGORIES, documentRepository } from './document-store.js';
import PdfPreview from './PdfPreview.jsx';

const formatSize = size => size < 1024*1024 ? `${Math.ceil(size/1024)} Ko` : `${(size/(1024*1024)).toFixed(1)} Mo`;
const date = value => new Date(value).toLocaleDateString('fr-FR');
const initial = { client: null, clients: [], documents: [] };

function DocumentReader({ document, bienId, repository, onClose }) {
  const [url, setUrl] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    let active = true, objectUrl;
    repository.getFile(bienId, document.id).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [bienId, document.id, repository]);
  const closeRef = useRef();
  useEffect(() => {
    const previouslyFocused = window.document.activeElement;
    closeRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);
  function keys(e) {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Tab') {
      const controls = [...e.currentTarget.querySelectorAll('button, a[href], iframe')];
      const first = controls[0], last = controls[controls.length-1];
      if (e.shiftKey && window.document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && window.document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  return <div className="document-reader-backdrop" role="dialog" aria-modal="true" aria-labelledby="document-reader-title" onKeyDown={keys}>
    <div className="document-reader">
      <header><div><p className="doc-eyebrow">CONSULTATION DU DOCUMENT</p><h2 id="document-reader-title">{document.title}</h2><p>{document.name}</p></div><button ref={closeRef} className="doc-secondary" onClick={onClose}>Fermer</button></header>
      {error ? <p role="alert">{error}</p> : !url ? <p role="status">Ouverture du document…</p> : <>
        <div className="document-reader-content">{document.mime === 'application/pdf'
          ? <PdfPreview url={url} title={document.title} />
          : document.mime.startsWith('image/') ? <img src={url} alt={document.title} />
          : <div className="document-no-preview"><h3>Ce document s’ouvre avec votre logiciel habituel.</h3><p>Téléchargez sa copie pour le consulter.</p></div>}</div>
        <footer><span>Le fichier d’origine reste conservé.</span><a className="doc-primary" href={url} download={document.name}>Télécharger le document</a></footer>
      </>}
    </div>
  </div>;
}

function DocumentCard({ document, bienId, repository, onSaved, onOpen, busy }) {
  const [editing, setEditing] = useState(false), [title, setTitle] = useState(document.title), [category, setCategory] = useState(document.category), [error, setError] = useState('');
  async function save(archived = !!document.archivedAt) {
    try { await repository.updateDocument(bienId, document.id, { title, category, archived }); setEditing(false); setError(''); await onSaved(); }
    catch(e) { setError(e.message); }
  }
  return <article className="document-card">
    <div className="document-format" aria-hidden="true">{document.name.split('.').pop().toUpperCase()}</div>
    <div className="document-card-body">
      {editing ? <form onSubmit={e => { e.preventDefault(); save(); }} className="document-edit">
        <label>Titre du document<input value={title} maxLength={200} onChange={e => setTitle(e.target.value)} required /></label>
        <label>Catégorie<select value={category} onChange={e => setCategory(e.target.value)}>{Object.entries(CATEGORIES).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <div><button className="doc-primary" type="submit">Enregistrer</button><button className="doc-secondary" type="button" onClick={() => { setTitle(document.title); setCategory(document.category); setEditing(false); }}>Annuler</button></div>
      </form> : <>
        <h4>{document.title}</h4><p className="document-source-name" title={document.name}>{document.name}</p>
        <div className="document-details"><span className="document-category">{CATEGORIES[document.category]}</span><span>{formatSize(document.size)}</span><span>Ajouté le {date(document.addedAt)}</span>{document.archivedAt && <span>Archivé</span>}</div>
        <div className="document-actions"><button className="doc-primary" onClick={() => onOpen(document)} disabled={busy}>Consulter</button><button className="doc-secondary" onClick={() => setEditing(true)} disabled={busy}>Renommer ou classer</button><button className="doc-text" disabled={busy} onClick={() => save(!document.archivedAt)}>{document.archivedAt ? 'Restaurer' : 'Archiver'}</button></div>
      </>}
      {error && <p role="alert" className="doc-error">{error}</p>}
    </div>
  </article>;
}

export default function DocumentsPanel({ bien, repository = documentRepository }) {
  const [data, setData] = useState(initial), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [clientId, setClientId] = useState(''), [clientName, setClientName] = useState(''), [category, setCategory] = useState('autres');
  const [search, setSearch] = useState(''), [filter, setFilter] = useState(''), [archived, setArchived] = useState(false), [selected, setSelected] = useState(null);
  const filesRef = useRef(), folderRef = useRef();
  const bienId = String(bien.id);
  async function reload() { const next = await repository.load(bienId); setData(next); }
  useEffect(() => {
    let active = true; setLoading(true); setData(initial); setSelected(null); setError(''); setNotice('');
    repository.load(bienId).then(next => { if (active) setData(next); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bienId, repository]);
  async function run(operation) {
    setBusy(true); setError(''); setNotice('');
    try { await operation(); await reload(); } catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  async function importFiles(e) {
    const selectedFiles = Array.from(e.target.files || []);
    // Ignore hidden backup folders when selecting an entire source directory.
    const files = selectedFiles.filter(file => !(file.webkitRelativePath || '').split('/').some(part => part.startsWith('.')));
    e.target.value = '';
    if (!files.length) return;
    await run(async () => {
      const result = await repository.addFiles(bienId, files, category);
      setNotice(`${result.added} document(s) ajouté(s)${result.duplicates ? ` · ${result.duplicates} doublon(s) déjà présent(s), conservé(s) une seule fois` : ''}.`);
    });
  }
  async function importLegacy() {
    await run(async () => {
      const files = [];
      for (const item of bien.dossier.attachments || []) {
        if (!item.url?.startsWith('data:')) throw new Error('Une ancienne pièce jointe ne contient pas de copie locale importable.');
        const response = await fetch(item.url), blob = await response.blob();
        files.push(new File([blob], item.name, { type: blob.type }));
      }
      const result = await repository.addFiles(bienId, files, 'autres');
      setNotice(`${result.added} ancienne(s) pièce(s) jointe(s) ajoutée(s). Leur copie précédente reste conservée.`);
    });
  }
  const active = data.documents.filter(doc => !doc.archivedAt);
  const shown = data.documents.filter(doc => !!doc.archivedAt === archived && (!filter || doc.category === filter) && `${doc.title} ${doc.name}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')));
  return <section className="documents-panel" aria-labelledby="documents-title">
    <header className="documents-heading"><div><p className="doc-eyebrow">PASSEPORT DU BIEN</p><h2 id="documents-title">Documents du bien</h2><p>Réunissez les pièces du client et retrouvez l’historique de son bien.</p></div><span className="document-count">{active.length} document{active.length > 1 ? 's' : ''}</span></header>
    {loading ? <p role="status">Chargement du dossier…</p> : <>
      <div className="document-client"><span className="client-avatar" aria-hidden="true">{data.client?.name.slice(0,1) || 'C'}</span><div><p className="doc-eyebrow">CLIENT DU DOSSIER</p>{data.client ? <><h3>{data.client.name}</h3><p>{bien.address}</p></> : <p>Associez un client pour commencer.</p>}</div></div>
      {!data.client && <form className="document-client-form" onSubmit={e => { e.preventDefault(); run(async () => { await repository.linkClient(bienId, { clientId: clientId || undefined, name: clientName }); setNotice('Client associé au bien.'); }); }}>
        {data.clients.length > 0 && <label>Client<select value={clientId} onChange={e => setClientId(e.target.value)}><option value="">Créer un nouveau client</option>{data.clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>}
        {!clientId && <label>Nom du client ou raison sociale<input required maxLength={160} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex. : Client du dossier" /></label>}
        <button className="doc-primary" disabled={busy}>Associer le client</button>
      </form>}
      {data.client && <div className="document-import">
        <div><h3>Ajouter au dossier</h3><p>PDF, images et documents bureautiques · 25 Mo par fichier</p></div>
        <label>Classer les nouveaux documents<select value={category} onChange={e => setCategory(e.target.value)} disabled={busy}>{Object.entries(CATEGORIES).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <div className="document-import-actions"><button className="doc-primary" disabled={busy} onClick={() => filesRef.current.click()}>{busy ? 'Enregistrement…' : 'Ajouter des fichiers'}</button><button className="doc-secondary" disabled={busy} onClick={() => folderRef.current.click()}>Importer un dossier</button></div>
        <input ref={filesRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx,.odt" onChange={importFiles} aria-label="Fichiers à ajouter au dossier du bien" hidden />
        <input ref={folderRef} type="file" webkitdirectory="" multiple onChange={importFiles} aria-label="Dossier à importer pour ce bien" hidden />
        {(bien.dossier.attachments || []).length > 0 && <button className="doc-text" onClick={importLegacy} disabled={busy}>Reprendre les {(bien.dossier.attachments || []).length} anciennes pièces jointes</button>}
      </div>}
      <div className="document-toolbar"><label>Rechercher<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Titre ou nom de fichier" /></label><label>Catégorie<select value={filter} onChange={e => setFilter(e.target.value)}><option value="">Toutes les catégories</option>{Object.entries(CATEGORIES).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="doc-text" onClick={() => setArchived(value => !value)}>{archived ? 'Voir les documents actifs' : `Archives (${data.documents.length-active.length})`}</button></div>
      {notice && <p role="status" className="doc-notice">{notice}</p>}{error && <p role="alert" className="doc-error">{error}</p>}
      {shown.length ? <div className="document-list">{shown.map(document => <DocumentCard key={document.id} document={document} bienId={bienId} repository={repository} onSaved={reload} onOpen={setSelected} busy={busy} />)}</div> : <div className="document-empty"><h3>{search || filter ? 'Aucun document trouvé' : archived ? 'Aucun document archivé' : 'Votre dossier documentaire est prêt à être rempli'}</h3><p>{search || filter ? 'Essayez un autre titre ou une autre catégorie.' : 'Ajoutez vos diagnostics, plans, documents administratifs et pièces de travaux.'}</p></div>}
      <p className="document-storage-note">{repository.server ? 'Documents enregistrés sur le serveur privé et accessibles depuis vos appareils avec votre compte CONNECT.' : 'Documents conservés dans ce navigateur, sur ce PC. Téléchargez une copie pour les retrouver sur un autre appareil.'}</p>
    </>}
    {selected && <DocumentReader document={selected} bienId={bienId} repository={repository} onClose={() => setSelected(null)} />}
  </section>;
}

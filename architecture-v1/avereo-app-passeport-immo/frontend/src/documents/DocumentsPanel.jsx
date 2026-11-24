import ReportPublications from './ReportPublications.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { CATEGORIES, DOCUMENT_ACCEPT, documentRepository, isCompressedArchive, MAX_FILE_SIZE, MAX_BATCH_SIZE } from './document-store.js';
import { volumeLabel } from '../../../../avereo-platform/shared/report-volumes.js';
import PdfPreview from './PdfPreview.jsx';
import DocumentPreview from './DocumentPreview.jsx';
import { importDocumentFiles } from './import-files.js';
import { documentSettings, orderedDocuments, movedDocumentSettings } from './document-settings.js';
import { CategoryIcon, CategorySettings, DocumentModal } from './DocumentOrganisation.jsx';

const formatSize = size => size < 1000000 ? `${Math.ceil(size/1000)} Ko` : `${(size/1000000).toFixed(1)} Mo`;
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
          : isCompressedArchive(document) ? <div className="document-no-preview"><h3>Archive compressée conservée dans le dossier du bien.</h3><p>Téléchargez-la pour l’ouvrir avec votre logiciel habituel. Son contenu n’est pas extrait dans l’application.</p></div>
          : <div className="document-no-preview"><h3>Ce document s’ouvre avec votre logiciel habituel.</h3><p>Téléchargez sa copie pour le consulter.</p></div>}</div>
        <footer><span>Le fichier d’origine reste conservé.</span><a className="doc-primary" href={url} download={document.name}>Télécharger le document</a></footer>
      </>}
    </div>
  </div>;
}

function DocumentCard({ document, bienId, repository, onSaved, onOpen, busy, onMove, first, last, readOnly, onPreview, previewed }) {
  const [editing, setEditing] = useState(false), [title, setTitle] = useState(document.title), [category, setCategory] = useState(document.category), [error, setError] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [pending, setPending] = useState(false), [confirming, setConfirming] = useState(false);
  const blocked = busy || pending;
  async function save(archived = !!document.archivedAt) {
    setPending(true);
    try { await repository.updateDocument(bienId, document.id, { title, category, archived }); setEditing(false); setError(''); await onSaved(); }
    catch(e) { setError(e.message); } finally { setPending(false); }
  }
  async function lifecycle(action) {
    setPending(true); setError('');
    try { await repository[action](bienId, document.id); await onSaved(); setConfirming(false); }
    catch (e) { setError(e.message); } finally { setPending(false); }
  }
  return <article className={`document-card${previewed ? ' is-previewed' : ''}`}>
    <div className="document-format" aria-hidden="true">{document.name.split('.').pop().toUpperCase()}</div>
    <div className="document-card-body">
      {editing ? <form onSubmit={e => { e.preventDefault(); save(); }} className="document-edit">
        <label>Titre du document<input value={title} maxLength={200} onChange={e => setTitle(e.target.value)} required /></label>
        <label>Catégorie<select value={category} onChange={e => setCategory(e.target.value)}>{Object.entries(CATEGORIES).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <div><button className="doc-primary" type="submit">Enregistrer</button><button className="doc-secondary" type="button" onClick={() => { setTitle(document.title); setCategory(document.category); setEditing(false); }}>Annuler</button></div>
      </form> : <>
        <h4><button className="document-title" title="Afficher l’aperçu" aria-pressed={previewed} onClick={() => onPreview(document.id)}>{document.title}</button></h4><p className="document-source-name" title={document.name}>{document.name}</p>
        <div className="document-details"><span className="document-category">{CATEGORIES[document.category]}</span><span>{formatSize(document.size)}</span><span>Ajouté le {date(document.addedAt)}</span>{document.archivedAt && <span>Archivé</span>}{document.trashedAt && <span>Corbeille · {date(document.trashedAt)}</span>}</div>
        <div className="document-actions"><button className="doc-primary" onClick={() => onOpen(document)} disabled={blocked}>Consulter</button>
          {!readOnly && <button className="doc-secondary" aria-label={`Actions : ${document.title}`} aria-expanded={actionsOpen} onClick={() => setActionsOpen(value => !value)}>Actions ···</button>}
        </div>
        {!readOnly && actionsOpen && <div className="document-secondary-actions" onKeyDown={e => { if (e.key === 'Escape') { setActionsOpen(false); e.currentTarget.previousElementSibling.querySelector('[aria-expanded]').focus(); } }}>
          {(document.trashedAt ? <><button className="doc-secondary" disabled={blocked} onClick={() => lifecycle('restoreDocument')}>Restaurer le document</button><button className="doc-danger" disabled={blocked} onClick={() => setConfirming(true)}>Supprimer définitivement</button></>
            : <><button className="doc-secondary" onClick={() => setEditing(true)} disabled={blocked}>Renommer ou classer</button><button className="doc-text" disabled={blocked} onClick={() => save(!document.archivedAt)}>{document.archivedAt ? 'Restaurer' : 'Archiver'}</button><button className="doc-text" disabled={blocked} onClick={() => lifecycle('trashDocument')}>Mettre à la corbeille</button></>)}
          {!readOnly && onMove && <><button className="doc-text" aria-label={`Monter : ${document.title}`} disabled={blocked || first} onClick={() => onMove(document.id, -1)}>↑ Monter</button><button className="doc-text" aria-label={`Descendre : ${document.title}`} disabled={blocked || last} onClick={() => onMove(document.id, 1)}>↓ Descendre</button></>}
        </div>}
      </>}
      {error && !confirming && <p role="alert" className="doc-error">{error}</p>}
      {confirming && <DocumentModal title="Supprimer définitivement ce document ?" busy={pending} onClose={() => setConfirming(false)}><p><strong>{document.title}</strong></p><p>Le fichier sera effacé de ce dossier. Il ne pourra plus être restauré depuis la corbeille.</p><p>Les copies des sauvegardes antérieures suivent leur durée de conservation habituelle.</p>{error && <p role="alert" className="doc-error">{error}</p>}<footer><button className="doc-secondary" disabled={pending} onClick={() => setConfirming(false)}>Annuler</button><button className="doc-danger" disabled={pending} onClick={() => lifecycle('deleteDocument')}>{pending ? 'Suppression…' : 'Confirmer la suppression définitive'}</button></footer></DocumentModal>}
    </div>
  </article>;
}

export default function DocumentsPanel({ bien, repository = documentRepository, onClient, readOnly = false, onShare, section = 'documents', snapshot }) {
  const [data, setData] = useState(initial), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [clientId, setClientId] = useState(''), [clientName, setClientName] = useState(''), [category, setCategory] = useState('autres');
  const [importProgress, setImportProgress] = useState(null), [retryImport, setRetryImport] = useState(null);
  const [importOpen, setImportOpen] = useState(true), [previewId, setPreviewId] = useState(null);
  const [search, setSearch] = useState(''), [filter, setFilter] = useState(''), [view, setView] = useState('active'), [selected, setSelected] = useState(null);
  const [categoryEditor, setCategoryEditor] = useState(false), [collapsed, setCollapsed] = useState({});
  const filesRef = useRef(), folderRef = useRef();
  const bienId = String(bien.id);
  useEffect(() => { onClient?.({bienId,name:data.client?.name || ''}); },[bienId,data.client,onClient]);
  async function reload() { const next = await repository.load(bienId); setData(next); }
  useEffect(() => {
    let active = true; setLoading(true); setData(initial); setSelected(null); setError(''); setNotice(''); setView('active'); setCategoryEditor(false); setPreviewId(null); setRetryImport(null);
    if (snapshot) { setData(snapshot); setLoading(false); return () => { active = false; }; }
    repository.load(bienId).then(next => { if (active) { setData(next); setImportOpen(!next.client || !next.documents.length); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bienId, repository]);
  useEffect(() => { if (snapshot) setData(snapshot); }, [snapshot]);
  async function run(operation) {
    setBusy(true); setError(''); setNotice('');
    try { await operation(); await reload(); return true; } catch(e) {
      setError(e.message);
      if (e.importProgress?.completedBatches) {
        const saved = e.importProgress;
        setNotice(`${saved.added} document(s) ajouté(s) et ${saved.duplicates} doublon(s) confirmé(s) avant l’interruption. Relancez la même sélection pour reprendre : les doublons seront évités.`);
        try { await reload(); } catch { setError(`${e.message} La liste n’a pas pu être actualisée. Rouvrez le bien pour retrouver les fichiers déjà enregistrés.`); }
      }
      return false;
    } finally { setBusy(false); setImportProgress(null); }
  }
  async function importFiles(e) {
    const selectedFiles = Array.from(e.target.files || []);
    // Ignore hidden backup folders when selecting an entire source directory.
    const files = selectedFiles.filter(file => !(file.webkitRelativePath || '').split('/').some(part => part.startsWith('.')));
    e.target.value = '';
    if (!files.length) return;
    await sendFiles(files, category);
  }
  async function sendFiles(files, importCategory) {
    setRetryImport(null);
    await run(async () => {
      try {
        const result = await importDocumentFiles(repository, bienId, files, importCategory, setImportProgress);
        setNotice(`${result.added} document(s) ajouté(s)${result.duplicates ? ` · ${result.duplicates} doublon(s) déjà présent(s), conservé(s) une seule fois` : ''}.`);
      } catch (error) {
        if (error.importProgress) setRetryImport({ files: files.slice(error.importProgress.processedFiles), category: importCategory });
        throw error;
      }
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
      const result = await importDocumentFiles(repository, bienId, files, 'autres', setImportProgress);
      setNotice(`${result.added} ancienne(s) pièce(s) jointe(s) ajoutée(s). Leur copie précédente reste conservée.`);
    });
  }
  const settings = documentSettings(data.settings);
  const active = data.documents.filter(doc => !doc.archivedAt && !doc.trashedAt);
  const archived = data.documents.filter(doc => doc.archivedAt && !doc.trashedAt);
  const trashed = data.documents.filter(doc => doc.trashedAt);
  const shown = data.documents.filter(doc => (view === 'trash' ? !!doc.trashedAt : !doc.trashedAt && (!!doc.archivedAt === (view === 'archived')))
    && (!filter || doc.category === filter) && `${doc.title} ${doc.name}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')));
  const preview = shown.find(doc => doc.id === previewId);
  async function saveSettings(value) { return run(() => repository.saveDocumentSettings(bienId, value)); }
  return <section className="documents-panel" aria-labelledby="documents-title">
    <div hidden={section !== 'documents'}>
    <header className="documents-heading"><div><p className="doc-eyebrow">{readOnly ? 'PARTAGE EN LECTURE SEULE' : 'PASSEPORT DU BIEN'}</p><h2 id="documents-title">Documents du bien</h2><p>{readOnly ? `${bien.address} · Consultation et téléchargement uniquement.` : 'Votre bibliothèque de documents, classée par catégorie.'}</p></div><span className="document-count">{active.length} document{active.length > 1 ? 's' : ''}</span>{!readOnly && <button className="doc-primary" aria-expanded={importOpen} onClick={() => setImportOpen(value => !value)}>Ajouter des documents</button>}{!readOnly && onShare && <button className="doc-secondary" onClick={onShare}>Partager les documents</button>}</header>
    {loading ? <p role="status">Chargement du dossier…</p> : <>
      {!readOnly && <><div className="document-import-panel" hidden={!importOpen}><div className="document-client"><span className="client-avatar" aria-hidden="true">{data.client?.name.slice(0,1) || 'C'}</span><div><p className="doc-eyebrow">CLIENT DU DOSSIER</p>{data.client ? <><h3>{data.client.name}</h3><p>{bien.address}</p></> : <><h3>1. Associer le client</h3><p id="document-client-help">Cette première étape active l’ajout de fichiers pour ce bien.</p></>}</div></div>
      {!data.client && <form className="document-client-form" aria-describedby="document-client-help" onSubmit={e => { e.preventDefault(); run(async () => { await repository.linkClient(bienId, { clientId: clientId || undefined, name: clientName }); setNotice('Client associé. Vous pouvez maintenant ajouter des fichiers.'); }); }}>
        {data.clients.length > 0 && <label>Client<select value={clientId} onChange={e => setClientId(e.target.value)}><option value="">Créer un nouveau client</option>{data.clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>}
        {!clientId && <label>Nom du client ou raison sociale<input required maxLength={160} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex. : Client du dossier" /></label>}
        <button className="doc-primary" disabled={busy}>Associer le client</button>
      </form>}
      <div className="document-import">
        <div><h3>2. Ajouter des documents</h3><p>PDF, images, documents bureautiques et archives ZIP, 7z, RAR, TAR, GZ ou TGZ · {volumeLabel(MAX_FILE_SIZE)} par fichier · Envois répartis automatiquement en lots de {volumeLabel(MAX_BATCH_SIZE)} et 100 fichiers maximum, sans découper les fichiers.</p></div>
        <label>Classer les nouveaux documents<select value={category} onChange={e => setCategory(e.target.value)} disabled={busy || !data.client}>{Object.entries(CATEGORIES).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        {!data.client && <p id="document-import-help" className="document-import-help">Associez d’abord le client ci-dessus pour activer ces boutons.</p>}
        <div className="document-import-actions"><button className="doc-primary" disabled={busy || !data.client} aria-describedby={!data.client ? 'document-import-help' : undefined} onClick={() => filesRef.current.click()}>{busy ? 'Enregistrement…' : 'Ajouter des fichiers'}</button><button className="doc-secondary" disabled={busy || !data.client} aria-describedby={!data.client ? 'document-import-help' : undefined} onClick={() => folderRef.current.click()}>Importer un dossier</button></div>
        <input ref={filesRef} type="file" multiple accept={DOCUMENT_ACCEPT} onChange={importFiles} disabled={busy || !data.client} aria-label="Fichiers à ajouter au dossier du bien" hidden />
        <input ref={folderRef} type="file" webkitdirectory="" multiple onChange={importFiles} disabled={busy || !data.client} aria-label="Dossier à importer pour ce bien" hidden />
        {(bien.dossier.attachments || []).length > 0 && <button className="doc-text" onClick={importLegacy} disabled={busy || !data.client}>Reprendre les {(bien.dossier.attachments || []).length} anciennes pièces jointes</button>}
        <div className="document-storage-note"><strong>Enregistrement automatique des fichiers</strong><p>Chaque fichier est enregistré dès son ajout. Aucun bouton « Enregistrer » supplémentaire n’est nécessaire pour l’import.</p><p>{repository.server ? 'Stockage : serveur privé. Retrouvez les documents depuis vos appareils avec votre compte CONNECT.' : 'Stockage : ce navigateur, sur ce PC uniquement. Téléchargez une copie pour la conserver ailleurs.'}</p></div>
      </div>
      </div>
      {importProgress && <div role="status" className="doc-notice"><strong>{importProgress.phase === 'confirmed' ? 'Lot confirmé' : 'Envoi et vérification en cours'}</strong><p>Envoi du lot {importProgress.currentBatch} sur {importProgress.totalBatches} · {importProgress.processedFiles} fichier(s) confirmé(s) sur {importProgress.totalFiles}. Les lots confirmés sont déjà enregistrés.</p><progress aria-label="Fichiers confirmés" value={importProgress.processedFiles} max={importProgress.totalFiles} /></div>}</>}
      {!readOnly && <nav className="document-views" aria-label="État des documents"><button className="doc-secondary" aria-pressed={view === 'active'} disabled={busy} onClick={() => setView('active')}>Documents ({active.length})</button><button className="doc-secondary" aria-pressed={view === 'archived'} disabled={busy} onClick={() => setView('archived')}>Archives ({archived.length})</button><button className="doc-secondary" aria-pressed={view === 'trash'} disabled={busy} onClick={() => setView('trash')}>Corbeille ({trashed.length})</button><button className="doc-text" disabled={busy || !data.client} onClick={() => setCategoryEditor(true)}>Personnaliser les catégories</button></nav>}
      {view === 'trash' && <p className="document-trash-note">Les fichiers restent conservés jusqu’à leur suppression définitive. Restaurer conserve leur catégorie et leur éventuel état archivé. Aucune suppression automatique.</p>}
      <div className="document-toolbar"><label>Rechercher<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Titre ou nom de fichier" /></label><label>Catégorie<select value={filter} onChange={e => setFilter(e.target.value)}><option value="">Toutes les catégories</option>{Object.entries(CATEGORIES).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>{(search || filter) && <button className="doc-secondary" onClick={() => { setSearch(''); setFilter(''); }}>Effacer les filtres</button>}</div>
      {notice && <p role="status" className="doc-notice">{notice}</p>}{error && <p role="alert" className="doc-error">{error}</p>}
      {retryImport && <div className="doc-error"><p>L’envoi a été interrompu. Les fichiers des lots confirmés sont conservés.</p><button className="doc-secondary" disabled={busy} onClick={() => sendFiles(retryImport.files, retryImport.category)}>Reprendre les fichiers restants ({retryImport.files.length})</button><p>Le lot interrompu sera vérifié à nouveau pour éviter les doublons.</p></div>}
      <div className="document-workspace">
        <nav className="document-category-nav" aria-label="Dossiers de la bibliothèque"><p className="doc-eyebrow">CATÉGORIES</p><button aria-pressed={!filter} onClick={() => setFilter('')}>Tous les documents</button>{Object.entries(CATEGORIES).map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}><CategoryIcon appearance={settings.categories[key]} /><span>{label}</span><small>{data.documents.filter(doc => doc.category === key && (view === 'trash' ? doc.trashedAt : !doc.trashedAt && (!!doc.archivedAt === (view === 'archived')))).length}</small></button>)}</nav>
      {shown.length ? <div className="document-groups">{Object.entries(CATEGORIES).map(([key, label]) => {
        const documents = orderedDocuments(shown, settings, key);
        if (!documents.length) return null;
        return <section className="document-group" key={key} aria-label={`Dossier ${label}`}><header><button className="category-folder" aria-expanded={!collapsed[key]} onClick={() => setCollapsed(current => ({ ...current, [key]: !current[key] }))}><CategoryIcon appearance={settings.categories[key]} /><span>{label}<small>{documents.length} document{documents.length > 1 ? 's' : ''}</small></span><span className="category-chevron" aria-hidden="true">{collapsed[key] ? '▸' : '▾'}</span></button></header>{!collapsed[key] && <div className="document-list">{documents.map((document, index) => <DocumentCard key={document.id} document={document} bienId={bienId} repository={repository} readOnly={readOnly} onSaved={reload} onOpen={setSelected} onPreview={setPreviewId} previewed={previewId === document.id} busy={busy} first={index === 0} last={index === documents.length - 1} onMove={!search ? (id, direction) => saveSettings(movedDocumentSettings(data.documents, settings, documents, id, direction)) : undefined} />)}</div>}</section>;
      })}</div> : <div className="document-empty"><h3>{search || filter ? 'Aucun document trouvé' : view === 'trash' ? 'La corbeille est vide' : view === 'archived' ? 'Aucun document archivé' : 'Votre dossier documentaire est prêt à être rempli'}</h3><p>{search || filter ? 'Essayez un autre titre ou une autre catégorie.' : view === 'trash' ? 'Les documents mis à la corbeille apparaîtront ici.' : 'Ajoutez vos diagnostics, plans, documents administratifs et pièces de travaux.'}</p></div>}
      <DocumentPreview key={preview?.id || 'empty'} document={preview} bienId={bienId} repository={repository} onOpen={setSelected} onClose={() => setPreviewId(null)} />
      </div>
      {categoryEditor && <CategorySettings settings={settings} busy={busy} onClose={() => setCategoryEditor(false)} onSave={async value => { if (await saveSettings(value)) setCategoryEditor(false); }} />}
    </>}
    </div>
    {!readOnly && <section hidden={section !== 'rapports'} aria-label="Rapports privés du bien"><header className="documents-heading"><div><p className="doc-eyebrow">RAPPORTS DU BIEN</p><h2>Versions finalisées de Rapport</h2><p>Les copies complètes restent privées. Seule la restitution client rejoint les documents partageables.</p></div></header>{!repository.server ? <p>La publication des versions finalisées de Rapport est disponible avec le stockage serveur, depuis CONNECT.</p> : !data.client ? <p>Associez d’abord le client dans Documents pour publier un rapport sur ce bien.</p> : <ReportPublications key={bienId} bienId={bienId} repository={repository} onSaved={reload} />}</section>}
    {selected && <DocumentReader document={selected} bienId={bienId} repository={repository} onClose={() => setSelected(null)} />}
  </section>;
}

import React, { useEffect, useRef, useState } from 'react';
import { DocumentModal } from './DocumentOrganisation.jsx';

export default function ReportPublications({ bienId, repository, onSaved }) {
  const [items, setItems] = useState([]), [candidate, setCandidate] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const input = useRef();
  const available = repository.server && repository.publications && repository.publishReport;
  useEffect(() => {
    if (!available) return undefined;
    let active = true;
    repository.publications(bienId).then(data => { if (active) setItems(data.publications); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [bienId, repository, available]);
  async function publish() {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await repository.publishReport(bienId, candidate);
      setCandidate(null);
      setItems((await repository.publications(bienId)).publications);
      await onSaved();
      setMessage(result.alreadyPublished ? 'Cette version est déjà conservée. Aucun doublon créé.' : 'Version conservée : restitution client dans les documents, copie complète privée disponible ci-dessous.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function download(item) {
    setBusy(true); setError('');
    try {
      const blob = await repository.publicationSource(bienId, item.id);
      const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
      const sha = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      if (blob.size !== item.size || sha !== item.sha256) throw new Error('La copie reçue diffère de la version conservée. Réessayez.');
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `rapport-${item.id}.avereo.zip`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <details className="document-group"><summary>Versions finalisées de Rapport · copies complètes privées</summary>
    <p>Importez le fichier « .avereo.zip » préparé dans l’onglet Export de Rapport. La restitution client sera ajoutée aux documents de ce bien. La copie complète reste réservée à votre compte, en dehors des partages.</p>
    {!available ? <p>Cette conservation nécessite l’espace en ligne accessible depuis CONNECT.</p> : <>
      <button type="button" className="doc-secondary" disabled={busy} onClick={() => input.current?.click()}>Importer un dossier Rapport finalisé</button>
      <input ref={input} type="file" accept=".avereo.zip" hidden aria-label="Choisir un dossier Rapport finalisé" onChange={e => {
        const file = e.target.files?.[0]; e.target.value = ''; setError('');
        if (!file) return;
        if (!/\.avereo\.zip$/i.test(file.name) || file.size > 500 * 1024 * 1024) { setError('Choisissez un fichier .avereo.zip de 500 Mo maximum, préparé dans Rapport.'); return; }
        setCandidate(file);
      }} />
      {items.length === 0 ? <p>Aucune version Rapport conservée pour ce bien.</p> : <ul>{items.map(item => <li key={item.id}>
        <strong>{item.title}</strong> · {item.reference} · {new Date(item.publishedAt).toLocaleString('fr-FR')}
        <button type="button" className="doc-text" disabled={busy} onClick={() => download(item)}>Télécharger la copie privée pour Rapport</button>
      </li>)}</ul>}
      <p>Pour reprendre la visite, téléchargez la copie privée puis utilisez « Charger un dossier JSON ou Passeport » dans Rapport. Une sauvegarde en ligne créera un nouveau dossier sous votre compte.</p>
    </>}
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="doc-error">{error}</p>}
    {candidate && <DocumentModal title="Conserver cette version Rapport ?" busy={busy} onClose={() => setCandidate(null)}>
      <p><strong>{candidate.name}</strong></p>
      <p>La restitution client rejoint les documents actifs de ce bien et devient accessible à ses destinataires CONNECT actuels et futurs. La copie complète, avec les notes et originaux, reste privée pour votre compte.</p>
      {error && <p role="alert" className="doc-error">{error}</p>}
      <footer><button type="button" className="doc-secondary" disabled={busy} onClick={() => setCandidate(null)}>Annuler</button><button type="button" className="doc-primary" disabled={busy} onClick={publish}>{busy ? 'Vérification et conservation…' : 'Confirmer la conservation de cette version'}</button></footer>
    </DocumentModal>}
  </details>;
}

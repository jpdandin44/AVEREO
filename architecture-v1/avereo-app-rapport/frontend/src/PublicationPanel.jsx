import React, { useState } from 'react';

export default function PublicationPanel({ disabled, onPrepare }) {
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  return <details className="field-card"><summary>Conserver et partager dans Passeport Immo</summary>
    <p>Préparez une version datée : restitution client Word et copie complète privée, avec les originaux photo conservés en ligne. Le dossier source reste conservé.</p>
    <p>Pour la relire avant confirmation, choisissez « Synthèse client » dans les options du livrable et ouvrez l’aperçu. La publication utilise cette restitution client.</p>
    <p>Importez ensuite ce fichier dans le dossier documentaire du bien choisi dans Passeport Immo. Seule la restitution client rejoint ses documents partageables. La copie complète se télécharge en privé pour être réouverte dans Rapport.</p>
    <label><input type="checkbox" checked={confirmed} disabled={busy || disabled} onChange={e => { setConfirmed(e.target.checked); setMessage(''); }} /> J’ai relu la restitution client et je confirme sa finalisation pour cette version.</label>
    <button type="button" className="button secondary" disabled={disabled || busy || !confirmed} onClick={async () => {
      setBusy(true); setMessage('');
      try { if (await onPrepare()) { setConfirmed(false); setMessage('Fichier préparé. Importez-le dans Passeport Immo pour le conserver en ligne ; il n’est pas encore publié.'); } }
      catch (error) { setMessage(error.message); }
      finally { setBusy(false); }
    }}>{busy ? 'Préparation et vérification des fichiers…' : 'Préparer le dossier pour Passeport Immo'}</button>
    {message && <p role="status">{message}</p>}
  </details>;
}

import React, { useState } from 'react';

export default function ReviewPanel({ disabled, onPrepare, onPackage, onDownload }) {
  const [prepared, setPrepared] = useState(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function run(action) {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <details className="field-card"><summary>Demander une relecture experte dans Passeport Immo</summary>
    <p>Préparez les documents Word privés. L’expert les relira dans Word, puis pourra les valider ou demander des corrections. Le PDF client sera préparé après cette validation.</p>
    <button type="button" className="button secondary" disabled={disabled || busy} onClick={() => run(async () => {
      setPrepared(null);
      setPrepared(await onPrepare());
    })}>1. Préparer les deux Word pour relecture</button>
    {prepared && <>
      <p>Ces Word sont les documents soumis à relecture. Les corrections métier se font dans Rapport puis nécessitent une nouvelle préparation. Aucun PDF n’est demandé avant la validation des Word.</p>
      <div className="button-row">
        <button type="button" className="button ghost" disabled={disabled || busy} onClick={() => run(() => onDownload(prepared.expertWord, 'expert.docx'))}>Télécharger le Word expert</button>
        <button type="button" className="button ghost" disabled={disabled || busy} onClick={() => run(() => onDownload(prepared.clientWord, 'client.docx'))}>Télécharger le Word client</button>
      </div>
      <button type="button" className="button secondary" disabled={disabled || busy} onClick={() => run(async () => {
        if (await onPackage(prepared)) setMessage('Demande Word préparée. Dans Passeport Immo, ouvrez le bien puis « Relecture experte » pour importer ce fichier et désigner le relecteur. Aucun document n’est encore partagé avec le client.');
      })}>2. Préparer la demande pour Passeport Immo</button>
    </>}
    {busy && <p role="status">Préparation de la version de revue…</p>}
    {message && <p role="status">{message}</p>}
  </details>;
}

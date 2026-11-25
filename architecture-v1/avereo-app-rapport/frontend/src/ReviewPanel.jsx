import React, { useState } from 'react';

export default function ReviewPanel({ disabled, onPrepare, onPackage, onDownload }) {
  const [prepared, setPrepared] = useState(null), [clientPdf, setClientPdf] = useState(null), [expertPdf, setExpertPdf] = useState(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function run(action) {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <details className="field-card"><summary>Demander une relecture experte dans Passeport Immo</summary>
    <p>Préparez une version privée. L’expert pourra valider les PDF exacts ou demander des corrections, avant toute publication au client.</p>
    <button type="button" className="button secondary" disabled={disabled || busy} onClick={() => run(async () => {
      setPrepared(null); setClientPdf(null); setExpertPdf(null);
      setPrepared(await onPrepare());
    })}>1. Préparer les deux Word pour relecture</button>
    {prepared && <>
      <p>Convertissez ces deux Word en PDF, sans modifier leur contenu. Les corrections se font dans Rapport puis nécessitent une nouvelle préparation.</p>
      <div className="button-row">
        <button type="button" className="button ghost" disabled={disabled || busy} onClick={() => run(() => onDownload(prepared.expertWord, 'expert.docx'))}>Télécharger le Word expert</button>
        <button type="button" className="button ghost" disabled={disabled || busy} onClick={() => run(() => onDownload(prepared.clientWord, 'client.docx'))}>Télécharger le Word client</button>
      </div>
      <label>PDF expert de cette version<input type="file" accept=".pdf,application/pdf" disabled={disabled || busy} onChange={e => setExpertPdf(e.target.files?.[0] || null)} /></label>
      <label>PDF client de cette version<input type="file" accept=".pdf,application/pdf" disabled={disabled || busy} onChange={e => setClientPdf(e.target.files?.[0] || null)} /></label>
      <button type="button" className="button secondary" disabled={disabled || busy || !clientPdf || !expertPdf} onClick={() => run(async () => {
        if (await onPackage(prepared, clientPdf, expertPdf)) setMessage('Demande préparée. Dans Passeport Immo, ouvrez le bien puis « Relecture experte » pour importer ce fichier et désigner le relecteur. Aucun document n’est encore partagé avec le client.');
      })}>2. Préparer la demande pour Passeport Immo</button>
    </>}
    {busy && <p role="status">Préparation de la version de revue…</p>}
    {message && <p role="status">{message}</p>}
  </details>;
}

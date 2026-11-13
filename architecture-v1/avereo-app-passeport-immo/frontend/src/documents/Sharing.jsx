import React, { useEffect, useMemo, useState } from 'react';
import { SERVER_STORAGE, serverStorage } from './server-store.js';
import { DocumentModal } from './DocumentOrganisation.jsx';
import DocumentsPanel from './DocumentsPanel.jsx';

export function SharingDialog({ bien, onClose, repository=serverStorage.repository, online=SERVER_STORAGE }) {
  const [state,setState]=useState({revision:0,grants:[]}),[recipient,setRecipient]=useState(''),[verified,setVerified]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{let active=true;if(online)repository.shares(bien.id).then(s=>{if(active)setState(s);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[bien.id,repository,online]);
  async function run(action){setBusy(true);setError('');setNotice('');try{await action();}catch(e){setError(e.message);if(e.status===409)try{setState(await repository.shares(bien.id));}catch{/* Keep the explicit error. */}}finally{setBusy(false);}}
  return <DocumentModal title="Partager les documents du bien" busy={busy} onClose={onClose}>
    <p><strong>{bien.address}</strong></p>
    {!online ? <p>Le partage entre comptes est disponible dans Passeport Immo avec le stockage serveur, depuis CONNECT. Un lien vers cette version locale ne transmet pas vos documents.</p> : <>
      <p>Accès nominatif en lecture seule aux documents actifs : liste, consultation et téléchargement. Les archives et la corbeille restent privées. Les futurs documents actifs seront également accessibles jusqu’à révocation.</p>
      <form onSubmit={e=>{e.preventDefault();run(async()=>setVerified(await repository.resolveRecipient(bien.id,recipient)));}}>
        <label>Compte CONNECT du destinataire<input required maxLength={254} value={recipient} onChange={e=>{setRecipient(e.target.value);setVerified(null);}} placeholder="Identifiant ou adresse e-mail exacte" disabled={busy}/></label>
        <button className="doc-secondary" disabled={busy || !recipient.trim()}>Vérifier le destinataire</button>
      </form>
      {verified && <div className="doc-notice"><p><strong>Destinataire : {verified.label}</strong></p><p>{verified.ready?'Compte CONNECT et accès Passeport Immo actifs.':'Activation CONNECT en attente : le partage sera préparé, mais restera fermé jusqu’à son activation.'}</p><button className="doc-primary" disabled={busy} onClick={()=>run(async()=>{setState(await repository.grantShare(bien.id,recipient,state.revision,verified.recipient));setNotice('Partage enregistré. Le destinataire le retrouve dans « Documents partagés avec moi » après connexion à CONNECT.');setVerified(null);setRecipient('');})}>Confirmer le partage en lecture seule</button></div>}
      <h3>Accès à ce bien</h3>
      {state.grants.filter(g=>!g.revokedAt).length===0?<p>Aucun partage actif.</p>:<ul className="document-share-list">{state.grants.filter(g=>!g.revokedAt).map(g=><li key={g.id}><div><strong>{g.label}</strong><p>{g.ready?'Lecture seule':'En attente de l’activation ou du droit CONNECT'}</p></div><button className="doc-secondary" disabled={busy} onClick={()=>run(async()=>{setState(await repository.revokeShare(bien.id,g.id,state.revision));setNotice('Accès révoqué. Les prochaines consultations et téléchargements seront refusés.');})}>Révoquer l’accès à {g.label}</button></li>)}</ul>}
      <p>Aucun e-mail n’est envoyé automatiquement. Le destinataire ouvre Passeport Immo depuis son propre compte CONNECT. Les copies qu’il a déjà téléchargées restent sur son appareil.</p>
    </>}
    {notice&&<p role="status" className="doc-notice">{notice}</p>}{error&&<p role="alert" className="doc-error">{error}</p>}
  </DocumentModal>;
}

export function SharedDocuments({ repository=serverStorage.repository, online=SERVER_STORAGE }) {
  const [shares,setShares]=useState([]),[selected,setSelected]=useState(null),[data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[generation,setGeneration]=useState(0);
  async function reload(){setBusy(true);setError('');try{const next=await repository.incomingShares();setShares(next.shares);if(selected){const detail=await repository.sharedDocuments(selected);setData(detail);setGeneration(x=>x+1);}}catch(e){setData(null);setError(e.message);}finally{setBusy(false);}}
  useEffect(()=>{let active=true;if(online)repository.incomingShares().then(r=>{if(active)setShares(r.shares);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[repository,online]);
  const readRepository=useMemo(()=>({server:true,load:()=>repository.sharedDocuments(selected),getFile:(_,id)=>repository.sharedFile(selected,id)}),[repository,selected]);
  if(!online)return null;
  return <section className="documents-panel shared-documents" aria-label="Documents partagés avec moi">
    <header className="documents-heading"><div><h2>Documents partagés avec moi</h2><p>Biens accessibles avec votre compte CONNECT, en lecture seule.</p></div><button className="doc-secondary" disabled={busy} onClick={reload}>Actualiser les partages</button></header>
    {error&&<p role="alert" className="doc-error">{error}</p>}
    {!shares.length&&!error&&<p>Aucun document partagé avec vous pour le moment.</p>}
    {shares.map(s=><div className="document-share-entry" key={s.id}><strong>{s.address}</strong><span>Partagé par {s.ownerLabel}</span><button className="doc-primary" disabled={busy} onClick={async()=>{setBusy(true);setError('');setData(null);try{const next=await repository.sharedDocuments(s.id);setSelected(s.id);setData(next);}catch(e){setError(e.message);}finally{setBusy(false);}}}>Ouvrir les documents de {s.address}</button></div>)}
    {data&&selected&&<><button className="doc-text" onClick={()=>{setSelected(null);setData(null);}}>Fermer le dossier partagé</button><DocumentsPanel key={`${selected}-${generation}`} bien={data.bien} repository={readRepository} readOnly /></>}
  </section>;
}

import { useState } from 'react';
import { genererFormulaire, telecharger } from '../lib/formulaires.js';
export function FormulaireOriginal({doc,ctx,planId}){
 const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
 const pack=globalThis.__AVEREO_UNI_TEMPLATES__;
 const modele=pack?.documents?.[doc.id];
 const exporter=async()=>{setBusy(true);setMessage('Préparation du document…');try{const r=await genererFormulaire({pack,docId:doc.id,dossier:ctx.dossier,parametres:ctx.parametres,planId});telecharger(r);setMessage('Document préparé avec les données de la fiche. Relire les champs restants et les cases avant utilisation. Les signatures restent vierges.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 return <div className="uni-export-status"><button className="btn" disabled={busy||!modele} onClick={exporter}>{busy?'Préparation…':`Télécharger le modèle rempli${modele?' · '+modele.extension.toUpperCase():''}`}</button><p>{modele?'Modèle source conservé · démonstration sur données fictives · version fournie à vérifier avant dépôt.':doc.id==='SYN'?'La synthèse UNI ne possède pas de formulaire officiel. Utilisez Imprimer.':'Modèle original non embarqué dans cette édition.'}</p>{message&&<p role="status">{message}</p>}</div>;
}

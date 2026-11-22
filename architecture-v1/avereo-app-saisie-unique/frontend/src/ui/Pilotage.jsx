import { useState } from 'react';
import { indicateurs, regrouper } from '../lib/pilotage.js';
import { eur } from '../lib/nombres.js';
import { useActions } from './contexte.js';
import { dossierDemonstration } from '../lib/demonstration.js';

export function VuePilotage({donnees, vue}) {
 const actions=useActions();
 const dossiers=donnees.ordre.map(id=>donnees.dossiers[id]).filter(Boolean);
 const k=indicateurs(dossiers,donnees.parametres);
 const [selection,setSelection]=useState('');
 const ouverts=dossiers.filter(d=>!['Soldé','Abandonner'].includes(d.valeurs.dos_statut));
 const liste=(ds)=><div className="uni-list">{ds.length?ds.map(d=><button className="uni-dossier-card" key={d.id} onClick={()=>actions.ouvrir(d.id)}><span><strong>{d.valeurs.dos_nom||d.id}</strong><small>{[d.valeurs.prop_nom,d.valeurs.log_commune].filter(Boolean).join(' · ')}</small></span><span className="badge">{d.valeurs.dos_statut||'Nouveau'}</span><span aria-hidden="true">→</span></button>):<p className="muted">Aucun dossier dans cette sélection.</p>}</div>;
 const importerDemo=()=>{
  actions.importer(JSON.stringify({format:'avereo-uni-sauvegarde',version:1,exporteLe:new Date().toISOString(),dossiers:[dossierDemonstration('demo')]}));
  for(const [k,v] of Object.entries({org_raison_sociale:'Cabinet Démonstration (fictif)',org_siret:'00000000000000',org_lieu:'Longages'}))if(!donnees.parametres[k])actions.setParametre(k,v);
  actions.afficher('liste');
 };
 if(vue==='programmes'||vue==='territoires'){
  const groupes=regrouper(dossiers,vue==='programmes'?'dos_programme':'log_epci');
  return <section className="panneau"><p className="uni-eyebrow">Organisation du portefeuille</p><h2>{vue==='programmes'?'Programmes':'Territoires / EPCI'}</h2><p className="muted">Retrouvez les dossiers rattachés à chaque {vue==='programmes'?'programme':'territoire'}. Les affectations se modifient dans la fiche Administrative.</p><div className="uni-groupes">{groupes.map(([nom,ds])=><button className="uni-kpi" key={nom} onClick={()=>setSelection(nom)} aria-pressed={selection===nom}><strong>{ds.length}</strong><span>{nom}</span></button>)}</div>{selection&&liste(groupes.find(([nom])=>nom===selection)?.[1]||[])}</section>;
 }
 if(vue==='travaux')return <section className="panneau"><p className="uni-eyebrow">Suivi transversal</p><h2>Travaux du portefeuille</h2><div className="scroll"><table className="lines"><thead><tr><th>Dossier</th><th>Plan</th><th>Poste</th><th>Matériau</th><th>Montant TTC</th></tr></thead><tbody>{dossiers.flatMap(d=>(d.plans.factures||d.plans.devis).postes.map(p=><tr key={`${d.id}-${p.id}`}><td><button className="lien" onClick={()=>actions.ouvrir(d.id)}>{d.valeurs.dos_nom||d.id}</button></td><td>{d.fige?'Factures':'Devis'}</td><td>{p.valeurs.pst_intitule}</td><td>{p.valeurs.pst_materiau||'—'}</td><td>{eur(Number(String(p.valeurs.pst_ttc||0).replace(',','.')))}</td></tr>))}</tbody></table></div></section>;
 return <section className="uni-dashboard"><div className="uni-welcome"><div><p className="uni-eyebrow">Votre espace de travail</p><h1>Chaque dossier, une seule saisie.</h1><p>Suivez l’accompagnement, préparez les documents et gardez les chiffres cohérents du devis aux factures.</p></div><button className="btn btn-primary" onClick={()=>actions.afficher('liste')}>Ouvrir les dossiers →</button></div><div className="uni-kpis"><div className="uni-kpi"><strong>{k.total}</strong><span>Dossiers suivis</span></div><div className="uni-kpi"><strong>{k.alertes}</strong><span>Alertes et relances</span></div><div className="uni-kpi"><strong>{k.factures}</strong><span>En phase factures</span></div><div className="uni-kpi"><strong>{eur(k.travaux)}</strong><span>Travaux TTC renseignés</span></div></div><div className="uni-dashboard-grid"><section className="panneau"><h2>À suivre en priorité</h2>{liste(dossiers.filter(d=>d.valeurs.dos_alarme==='oui'||d.valeurs.dos_statut==='Relance'))}<h2>Accompagnements en cours</h2>{liste(ouverts.slice(0,6))}</section><aside className="panneau"><h2>Le parcours UNI</h2><ol className="uni-parcours"><li>Renseigner le propriétaire et le logement</li><li>Décrire le projet et les travaux</li><li>Équilibrer le financement</li><li>Préparer les documents</li><li>Figer le devis, suivre les factures</li></ol><h3>Préparer une démonstration</h3><p>Ajoute un dossier fictif enrichi, sans remplacer tes dossiers.</p><button className="btn" onClick={importerDemo}>Ajouter le dossier démo complet</button><p className="hint">Les montants et performances sont illustratifs. Aucune demande d’aide n’est déposée.</p></aside></div></section>;
}

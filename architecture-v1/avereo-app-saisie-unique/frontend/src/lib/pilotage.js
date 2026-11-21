import { calculerDossier } from './calculs.js';

export const normaliser = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function filtrerDossiers(dossiers, { recherche = '', statut = '', type = '', programme = '', alertes = false } = {}) {
  const termes = normaliser(recherche).trim().split(/\s+/).filter(Boolean);
  return dossiers.filter(d => {
    const v=d.valeurs;
    const texte=normaliser([d.id,v.dos_nom,v.prop_nom,v.prop_prenom,v.log_commune,v.log_cp,v.dos_num_anah,v.dos_programme,v.log_epci].join(' '));
    return termes.every(t=>texte.includes(t)) && (!statut || v.dos_statut===statut)
      && (!type || d.type===type) && (!programme || v.dos_programme===programme)
      && (!alertes || v.dos_alarme==='oui' || v.dos_statut==='Relance');
  });
}
export function indicateurs(dossiers, parametres={}) {
  return dossiers.reduce((r,d)=>{
    r.total++; if(d.valeurs.dos_statut==='Soldé') r.soldes++;
    if(d.valeurs.dos_alarme==='oui'||d.valeurs.dos_statut==='Relance')r.alertes++;
    if(d.fige)r.factures++;
    const calc=calculerDossier(d,parametres); const p=calc.factures||calc.devis;
    r.travaux+=p.valeurs.fin_travaux_ttc;
    return r;
  },{total:0,soldes:0,alertes:0,factures:0,travaux:0});
}
export function regrouper(dossiers, champ) {
  const groupes=new Map();
  for(const d of dossiers){const nom=d.valeurs[champ]||'Non renseigné'; if(!groupes.has(nom))groupes.set(nom,[]);groupes.get(nom).push(d);}
  return [...groupes].sort(([a],[b])=>a.localeCompare(b,'fr'));
}

import { dossierExemple } from './exemple.js';
export function dossierDemonstration(id, maintenant='2026-11-21T10:00:00.000Z') {
 const d=dossierExemple(id,maintenant); d.exemple=false;
 Object.assign(d.valeurs,{
  dos_nom:'DÉMO — Maison Exemple · Longages',dos_programme:'Programme démonstration',dos_lot:'1',dos_num_anah:'000000001',dos_delegation:'Délégation fictive',dos_date_depot:'2026-11-20',dos_alarme:'oui',dos_statut:'En cours',
  prop_nom:'EXEMPLE',prop_prenom:'Camille',prop_civilite:'Mme',prop_qualite:'Propriétaire occupant',prop_telephone:'01 00 00 00 00',prop_email:'camille@example.test',
  log_adresse:'1 voie de Démonstration (adresse fictive)',log_cp:'31410',log_commune:'Longages',log_epci:'Territoire démonstration',log_annee:'1974',log_surface:'105',
  foy_personnes_toit:'2',foy_rfr:'24000',foy_rfr_annee:'2025',foy_niveau_ressources:'Modestes',
  dos_observations:'Dossier fictif destiné à la démonstration. Vérifier les pièces, finaliser le scénario retenu, puis préparer le dépôt. Aucun engagement ni dépôt réel.',
  ent_nom:'Entreprise Démonstration',ent_siret:'00000000000000',ent_travaux_executes_ht:'12400',ava_montant:'3000',
  doc_date:'2026-11-23',doc_lieu:'Longages',rfa_date:'2026-11-23',dos_date_visite1:'2026-11-15',dos_date_visite_fin:'2026-11-23',etp_conseiller:'Conseiller Démonstration',ent_representant:'Alex EXEMPLE',mand_identite:'Alex EXEMPLE, mandataire fictif, 1 voie de Démonstration',mand_lieu:'Longages',mand_date:'2026-11-23',
 });
 Object.assign(d.plans.devis.valeurs,{
  ene_audit_date:'2026-11-15',ene_audit_id:'AUDIT-DEMO-001',ene_scenario_ref:'S2-DEMO',ene_classe_avant:'251 à 330 E',ene_classe_apres:'111 à 180 C',ene_prim_avant:'280',ene_prim_apres:'150',ene_fin_avant:'240',ene_fin_apres:'120',ene_ges_avant:'55',ene_ges_apres:'20',ene_surface_ref_avant:'105',ene_surface_ref_apres:'105',fin_apport:'2000',fin_aide_anah:'4500',fin_ecoptz:'5900',
 });
 return d;
}

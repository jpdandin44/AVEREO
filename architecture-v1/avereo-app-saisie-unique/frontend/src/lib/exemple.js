// Dossier d'exemple : les données fictives de la maquette (T01 à T07), complétées de valeurs fictives pour les
// autres champs utiles à la démonstration. Aucune valeur d'un dossier réel.
import { nouveauDossier } from './modele.js';
import { aujourdHui } from './nombres.js';

export const POSTES_EXEMPLE = [
  { id: 1, valeurs: { pst_intitule: 'Isolation des combles', pst_travail: 'Isolation des combles perdus', pst_materiau: 'Ouate de cellulose', pst_surface: '90', pst_ht: '3200', pst_tva: '5,5 %', pst_ttc: '3376', pst_eligible: 'oui', pst_resistance_r: '7' } },
  { id: 2, valeurs: { pst_intitule: 'Remplacement des fenêtres', pst_travail: 'Remplacement des menuiseries extérieures', pst_materiau: 'PVC', pst_surface: '12', pst_ht: '6800', pst_tva: '5,5 %', pst_ttc: '7174', pst_eligible: 'oui', pst_uw: '1,3', pst_sw: '0,3' } },
  { id: 3, valeurs: { pst_intitule: 'Ventilation mécanique', pst_travail: 'Installation d’une VMC simple flux hygroréglable', pst_ht: '2400', pst_tva: '5,5 %', pst_ttc: '2532', pst_eligible: 'oui' } },
];

// Changement d'avis du propriétaire (maquette, T03) et retour au choix initial (T04).
export const VARIANTE = { pst_intitule: 'Remplacement des fenêtres (variante bois)', pst_ht: '8100', pst_ttc: '8545,50', pst_materiau: 'Bois' };
export const INITIAL = { pst_intitule: 'Remplacement des fenêtres', pst_ht: '6800', pst_ttc: '7174', pst_materiau: 'PVC' };
export const ID_POSTE_SCENARIO = 2;

export function dossierExemple(id, maintenant = new Date().toISOString()) {
  const d = nouveauDossier({ id, type: 'energie', nom: 'Dossier d’exemple', maintenant });
  d.exemple = true;
  d.valeurs = {
    ...d.valeurs,
    dos_statut: 'En cours',
    dos_programme: '',
    dos_alarme: 'non',
    dos_type_projet: 'Énergie',
    dos_observations: 'Exemple de texte libre : observations de la visite, rédigées par le conseiller.',
    prop_civilite: 'Mme',
    prop_nom: 'M. et Mme Exemple',
    prop_telephone: '01 00 00 00 00',
    prop_email: 'exemple@example.test',
    log_adresse: '1 rue de l’Exemple',
    log_cp: '31000',
    log_commune: 'Toulouse',
    log_type: 'Maison individuelle',
    log_annee: '1974',
    log_surface: '105',
    log_chauffage: 'Fioul',
    ent_nom: 'Entreprise Exemple SARL',
    dev_reference: 'DEV-EXEMPLE-001',
    ava_montant: '3000',
    doc_lieu: 'Toulouse',
    doc_date: aujourdHui(new Date(maintenant)),
  };
  d.plans.devis.valeurs = {
    ene_classe_avant: '251 à 330 E',
    fin_apport: '2000',
    fin_aide_anah: '4500',
    fin_ecoptz: '5900',
  };
  d.plans.devis.postes = JSON.parse(JSON.stringify(POSTES_EXEMPLE));
  d.prochainId = 4;
  return d;
}

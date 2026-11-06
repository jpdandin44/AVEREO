// Modèle d'un dossier et accès aux valeurs, quel que soit le niveau du champ (dossier, plan, ligne).
import { CHAMPS, GROUPES } from '../config/champs.js';
import { aujourdHui } from './nombres.js';

export const TYPES = [
  { id: 'energie', libelle: 'Énergie' },
  { id: 'adaptation', libelle: 'Adaptation' },
  { id: 'insalubrite', libelle: 'Insalubrité' },
];

export const ONGLETS = [
  { id: 'administratif', libelle: 'Administratif' },
  { id: 'projet', libelle: 'Projet' },
  { id: 'financement', libelle: 'Financement' },
  { id: 'energie', libelle: 'Énergie' },
  { id: 'travaux', libelle: 'Travaux' },
];

export const PLANS = [
  { id: 'devis', libelle: 'Devis' },
  { id: 'factures', libelle: 'Factures' },
];

export const CHAMP = Object.fromEntries(CHAMPS.map((c) => [c.id, c]));

export function champsDuGroupe(onglet, groupe) {
  return CHAMPS.filter((c) => c.onglet === onglet && c.groupe === groupe);
}

export function groupesDeLOnglet(onglet) {
  return GROUPES.filter((g) => g.onglet === onglet);
}

// Règle des types (cadrage §3.1, point 3) : les champs « à confirmer » restent visibles pour les trois types.
export function champApplicable(champ, type) {
  if (!champ) return false;
  if (champ.types === 'tous' || champ.types === 'a_confirmer') return true;
  if (champ.types === 'energie') return type === 'energie';
  if (champ.types === 'adaptation') return type === 'adaptation' || type === 'insalubrite';
  return false;
}

export function planVide() {
  return { valeurs: {}, postes: [], derogations: [] };
}

export function nouveauDossier({ id, type = 'energie', nom = '', maintenant = new Date().toISOString() } = {}) {
  return {
    id,
    type,
    exemple: false,
    variante: false,
    cree: maintenant,
    modifie: maintenant,
    valeurs: { dos_nom: nom, dos_statut: 'Nouveau', dos_annee: String(new Date(maintenant).getFullYear()), doc_date: aujourdHui(new Date(maintenant)) },
    occupants: [],
    plans: { devis: planVide(), factures: null },
    fige: null,
    journal: [],
    prochainId: 1,
  };
}

export function copie(x) {
  return JSON.parse(JSON.stringify(x));
}

// Plan éditable : le plan Devis tant qu'il n'est pas figé, ensuite le plan Factures.
export function planEditable(dossier) {
  return dossier.fige ? 'factures' : 'devis';
}

export function lirePlan(dossier, planId) {
  return dossier.plans[planId] || null;
}

// Valeur saisie d'un champ de niveau dossier ou plan.
export function valeur(dossier, id, planId = 'devis') {
  const c = CHAMP[id];
  if (c && c.plan) {
    const p = lirePlan(dossier, planId);
    return p ? p.valeurs[id] : undefined;
  }
  return dossier.valeurs[id];
}

export function lignes(dossier, niveau, planId = 'devis') {
  if (niveau === 'occupant') return dossier.occupants;
  const p = lirePlan(dossier, planId);
  if (!p) return [];
  return niveau === 'derogation' ? p.derogations : p.postes;
}

// Adresse du demandeur telle que l'attendent les imprimés : l'adresse propre si elle diffère, sinon celle du logement.
export function adresseDemandeur(dossier) {
  const v = dossier.valeurs;
  if (v.prop_adresse_differente && String(v.prop_adresse_differente).trim()) return String(v.prop_adresse_differente).trim();
  return [v.log_adresse, [v.log_cp, v.log_commune].filter(Boolean).join(' ')].filter((x) => x && String(x).trim()).join(', ');
}

export function nomComplet(dossier) {
  const v = dossier.valeurs;
  return [v.prop_nom, v.prop_prenom].filter((x) => x && String(x).trim()).join(' ');
}

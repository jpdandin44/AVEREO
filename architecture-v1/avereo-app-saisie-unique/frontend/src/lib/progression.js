// Progression d'un onglet (E09, T23) : part des champs remplis parmi ceux qu'utilisent les documents.
// Ne comptent pas : les champs de suivi (utilisés par aucun document, cadrage §3.2 point 4), les champs calculés,
// les champs « à confirmer », les champs étrangers au type de dossier ; pour les postes, seuls les champs requis
// par un document (intitulé, montant HT) comptent, poste par poste.
import { CHAMPS } from '../config/champs.js';
import { champApplicable, valeur } from './modele.js';
import { estVide } from './nombres.js';

const NON_SAISIS = new Set(['calcule', 'zone', 'images']);

export function champsComptes(onglet, type) {
  return CHAMPS.filter((c) => c.onglet === onglet && c.documents.length > 0 && !NON_SAISIS.has(c.saisie)
    && c.statut !== 'a_confirmer' && champApplicable(c, type)
    && (c.niveau === 'dossier' || (c.niveau === 'poste' && c.requisPar.length > 0)));
}

export function progression(dossier, onglet, planId = 'devis') {
  const plan = dossier.plans[planId] || dossier.plans.devis;
  let total = 0;
  let remplis = 0;
  for (const c of champsComptes(onglet, dossier.type)) {
    if (c.niveau === 'poste') {
      const postes = plan.postes.length ? plan.postes : [{ valeurs: {} }];
      for (const p of postes) {
        total += 1;
        if (!estVide(p.valeurs[c.id])) remplis += 1;
      }
    } else {
      total += 1;
      if (!estVide(valeur(dossier, c.id, planId))) remplis += 1;
    }
  }
  const etat = total === 0 ? 'sans_objet' : remplis === 0 ? 'vide' : remplis === total ? 'complet' : 'partiel';
  return { remplis, total, etat };
}

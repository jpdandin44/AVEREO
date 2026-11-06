// Logique des documents : plan lu, champs requis, signalements « À compléter », documents concernés.
import { CHAMPS } from '../config/champs.js';
import { DOCUMENTS, champsDuDocument } from '../config/documents.js';
import { CHAMP, champApplicable, valeur } from './modele.js';
import { estVide } from './nombres.js';
import { CHAMPS_AUTRES_AIDES, CHAMPS_PRETS, LIGNES_AIDES_PUBLIQUES } from './calculs.js';

const AIDES = [...LIGNES_AIDES_PUBLIQUES.flatMap((l) => l.champs), ...CHAMPS_AUTRES_AIDES];
const COUTS_HT = ['pst_ht', 'fin_honoraires_amo', 'fin_honoraires_moe', 'poste_struct'];
const COUTS_TTC = ['pst_ttc', 'fin_honoraires_amo', 'fin_honoraires_moe', 'poste_struct'];

// Champs saisis dont dépend chaque valeur calculée (pour signaler les documents mis à jour).
export const DEPENDANCES = {
  fin_travaux_ht: ['pst_ht', 'poste_struct'],
  fin_travaux_ttc: ['pst_ttc', 'poste_struct'],
  fin_eligibles_ht: ['pst_ht', 'pst_eligible', 'poste_struct'],
  fin_eligibles_ttc: ['pst_ttc', 'pst_eligible', 'poste_struct'],
  fin_depenses_ht: COUTS_HT,
  fin_depenses_ttc: COUTS_TTC,
  fin_pret: CHAMPS_PRETS,
  fin_aides: AIDES,
  fin_total_aides_publiques: LIGNES_AIDES_PUBLIQUES.flatMap((l) => l.champs),
  fin_total_ressources: ['fin_apport', ...CHAMPS_PRETS, ...AIDES],
  fin_reste_charge: [...COUTS_HT, 'pst_ttc', ...AIDES, 'base_equilibre'],
  fin_solde_projet: [...COUTS_HT, 'pst_ttc', ...AIDES, 'fin_apport', ...CHAMPS_PRETS, 'base_equilibre'],
  fin_cases_marge: [...COUTS_HT, 'fin_apport', ...CHAMPS_PRETS, ...AIDES],
  fin_subv_total_prev: AIDES,
  fin_subv_total_reel: AIDES,
  fin_devis_fige: ['plan_fige'],
  fin_ecart_ht: ['pst_ht', 'poste_struct'],
  fin_ecart_ttc: ['pst_ttc', 'poste_struct'],
  ene_gain_classes: ['ene_classe_avant', 'ene_classe_apres'],
  ene_ges_gain_classes: ['ene_ges_classe_avant', 'ene_ges_classe_apres'],
  ene_gain_pct: ['ene_prim_avant', 'ene_prim_apres'],
  ene_ges_gain_pct: ['ene_ges_avant', 'ene_ges_apres'],
  ent_devis_ht: ['pst_ht', 'poste_struct'],
  ent_pct_executes: ['ent_travaux_executes_ht', 'pst_ht', 'poste_struct'],
  ent_siren: ['ent_siret'],
  acp_declarant: ['prop_civilite', 'prop_nom', 'prop_prenom', 'prop_adresse_differente', 'log_adresse', 'log_cp', 'log_commune', 'prop_telephone'],
  pst_prix_ht_m2: ['pst_ht', 'pst_surface'],
  pst_prix_ttc_m2: ['pst_ttc', 'pst_surface'],
};

const CACHE = new Map();
export function champsUtilises(doc) {
  if (!CACHE.has(doc.id)) {
    const ids = champsDuDocument(doc);
    const etendu = new Set(ids);
    for (const id of ids) (DEPENDANCES[id] || []).forEach((d) => etendu.add(d));
    if ([...ids].some((x) => x.startsWith('pst_'))) etendu.add('poste_struct');
    CACHE.set(doc.id, etendu);
  }
  return CACHE.get(doc.id);
}

export function documentUtilise(doc, champ) {
  // Le gel du devis crée le plan Factures : les documents qui le lisent deviennent disponibles.
  if (champ === 'plan_fige' && doc.plans.includes('factures')) return true;
  return champsUtilises(doc).has(champ);
}

export function documentsConcernes(entree) {
  if (!entree) return [];
  return DOCUMENTS.filter((d) => entree.items.some((i) => documentUtilise(d, i.champ)));
}

export function requisDuDocument(doc) {
  const ids = new Set(CHAMPS.filter((c) => c.requisPar.includes(doc.id)).map((c) => c.id));
  (doc.requisPropose || []).forEach((x) => ids.add(x));
  return [...ids];
}

// Plan lu par un document : le plan choisi s'il est permis et existe, sinon le premier plan existant.
export function planDuDocument(doc, dossier, choix) {
  if (!doc.plans.length) return { planId: 'devis', disponible: true, choixPossibles: [] };
  const existants = doc.plans.filter((p) => dossier.plans[p]);
  if (!existants.length) return { planId: doc.plans[0], disponible: false, choixPossibles: [] };
  const planId = existants.includes(choix) ? choix : existants[0];
  return { planId, disponible: true, choixPossibles: existants };
}

const LIBELLE_POSTE = { pst_intitule: 'intitulé', pst_ht: 'montant HT', pst_ttc: 'montant TTC' };

// Libellé donné au champ par le document, à défaut celui de la configuration.
function libelleDansDocument(doc, id) {
  for (const s of [...doc.sections, ...(doc.signature ? [doc.signature] : [])]) {
    for (const it of s.items) {
      if (it.c === id && it.l) return it.l;
    }
  }
  return (CHAMP[id] && CHAMP[id].libelle) || id;
}

export function signalements(dossier, doc, planId, calc) {
  const { disponible } = planDuDocument(doc, dossier, planId);
  if (!disponible) return { indisponible: 'Disponible après « Figer au dépôt »', miss: [], note: null };
  const plan = dossier.plans[planId] || dossier.plans.devis;
  const miss = [];
  let posteManquant = false;
  for (const id of requisDuDocument(doc)) {
    const c = CHAMP[id];
    if (!c || c.statut === 'a_confirmer' || !champApplicable(c, dossier.type)) continue;
    if (c.niveau === 'poste') {
      if (!plan.postes.length) {
        if (!posteManquant) miss.push('Au moins un poste de travaux');
        posteManquant = true;
        continue;
      }
      plan.postes.forEach((p, i) => {
        if (estVide(p.valeurs[id])) miss.push(`Poste ${i + 1} : ${LIBELLE_POSTE[id] || c.libelle}`);
      });
    } else if (estVide(valeur(dossier, id, planId))) {
      miss.push(libelleDansDocument(doc, id));
    }
  }
  let note = null;
  if (doc.id === 'PF') {
    const cp = planId === 'factures' ? calc.factures : calc.devis;
    if (cp && cp.equilibre.etat !== 'equilibre') note = 'Plan non équilibré';
  }
  return { miss, note, indisponible: null };
}

export function statutDocument(s) {
  if (s.indisponible) return s.indisponible;
  if (s.miss.length) return `${s.miss.length} à compléter`;
  return s.note || '✓ Complet';
}

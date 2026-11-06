// Calculs de la V1 : sommes, écarts, moyennes et rapports simples, arrondis au centime (cadrage §13, Q13).
// Aucun calcul d'aide ni de TVA : les montants d'aides, le HT et le TTC sont saisis.
import { centimes, lireNombre, num, somme, fmtDate, estVide, eur } from './nombres.js';
import { adresseDemandeur } from './modele.js';

// Lignes du plan de financement de l'imprimé 13460*03 et champs saisis qui les alimentent.
// Les lignes de la capture sans équivalent sur l'imprimé (MDPH, FAP, SLA…) sont comptées en « autre aide publique »
// (questions Q04 et Q11) ; les primes non publiques (CEE, autres primes) en « autres aides ».
export const LIGNES_AIDES_PUBLIQUES = [
  { id: 'anah', libelle: 'Aide de l’Anah', champs: ['fin_aide_anah'] },
  { id: 'fart', libelle: 'Aide du FART (programme « Habiter Mieux »)', champs: ['fin_aide_fart'] },
  { id: 'epci', libelle: 'Commune ou établissement public de coopération intercommunale', champs: ['fin_aide_epci', 'fin_prime_epci'] },
  { id: 'departement', libelle: 'Département', champs: ['fin_aide_cd', 'fin_prime_cd'] },
  { id: 'region', libelle: 'Région', champs: ['fin_aide_region', 'fin_prime_cr'] },
  { id: 'ue', libelle: 'Union européenne', champs: ['fin_aide_ue'] },
  { id: 'retraite_base', libelle: 'Caisses de retraite - régime de base', champs: ['fin_aide_retraite_base'], organisme: 'fin_retraite_org_base' },
  { id: 'retraite_compl', libelle: 'Caisses de retraite complémentaires obligatoires', champs: ['fin_aide_retraite_compl'], organisme: 'fin_retraite_org_compl' },
  { id: 'autre_publique', libelle: 'Autre aide publique (ADEME, Agence de l’eau …)', champs: ['fin_aide_autre_publique', 'fin_aide_mdph', 'fin_aide_fap', 'fin_aide_sla', 'fin_aide_retraite', 'fin_aide_sans_nom', 'fin_energie_primaire'], nature: 'fin_aide_autre_publique_nature' },
];
export const CHAMPS_AUTRES_AIDES = ['fin_autres_aides', 'fin_prime_cee', 'fin_autres_primes'];
export const CHAMPS_PRETS = ['fin_ecoptz', 'fin_autre_pret', 'fin_pret1_montant', 'fin_pret2_montant', 'fin_pret3_montant'];

const LETTRES = 'ABCDEFG';
function rangClasse(v) {
  const m = /([A-G])\s*$/.exec(String(v || ''));
  return m ? LETTRES.indexOf(m[1]) : null;
}

function gainPct(avant, apres) {
  const a = lireNombre(avant);
  const b = lireNombre(apres);
  if (a == null || b == null || a === 0) return null;
  return Math.round(((a - b) / a) * 1000) / 10;
}

function prixAuM2(montant, surface) {
  const m = lireNombre(montant);
  const s = lireNombre(surface);
  if (m == null || s == null || s <= 0) return null;
  return centimes(m / s);
}

// Calculs d'un plan (Devis ou Factures). baseEquilibre : 'ht' (maquette) ou 'ttc' (paramètre).
export function calculerPlan(plan, { baseEquilibre = 'ht' } = {}) {
  if (!plan) return null;
  const v = plan.valeurs;
  const postes = plan.postes;
  const eligibles = postes.filter((p) => p.valeurs.pst_eligible !== 'non');
  const travauxHT = somme(postes.map((p) => p.valeurs.pst_ht));
  const travauxTTC = somme(postes.map((p) => p.valeurs.pst_ttc));
  const honoraires = somme([v.fin_honoraires_amo, v.fin_honoraires_moe]);
  const depensesHT = centimes(travauxHT + honoraires);
  const depensesTTC = centimes(travauxTTC + honoraires);
  const lignesAides = LIGNES_AIDES_PUBLIQUES.map((l) => ({ ...l, montant: somme(l.champs.map((c) => v[c])) }));
  const totalAidesPubliques = somme(lignesAides.map((l) => l.montant));
  const autresAides = somme(CHAMPS_AUTRES_AIDES.map((c) => v[c]));
  const subventions = centimes(totalAidesPubliques + autresAides);
  const prets = somme(CHAMPS_PRETS.map((c) => v[c]));
  const apport = num(v.fin_apport);
  const coutTravaux = baseEquilibre === 'ttc' ? travauxTTC : travauxHT;
  const cout = baseEquilibre === 'ttc' ? depensesTTC : depensesHT;
  const resteCharge = centimes(cout - subventions);
  const solde = centimes(resteCharge - (prets + apport));
  const totalRessources = centimes(apport + prets + subventions);

  let equilibre;
  if (coutTravaux === 0) equilibre = { etat: 'aucun', message: '! Aucun poste chiffré : le plan ne peut pas être équilibré.' };
  else if (solde === 0) equilibre = { etat: 'equilibre', message: '✓ Plan équilibré : le total financé couvre le coût des travaux.' };
  else if (solde > 0) equilibre = { etat: 'reste', montant: solde, message: `! Reste à financer : ${eur(solde)}.` };
  else equilibre = { etat: 'depasse', montant: -solde, message: `! Le financement dépasse le coût des travaux de ${eur(-solde)}.` };

  const classeAvant = rangClasse(v.ene_classe_avant);
  const classeApres = rangClasse(v.ene_classe_apres);
  const gesAvant = rangClasse(v.ene_ges_classe_avant);
  const gesApres = rangClasse(v.ene_ges_classe_apres);

  const parPoste = {};
  for (const p of postes) {
    parPoste[p.id] = {
      pst_prix_ht_m2: prixAuM2(p.valeurs.pst_ht, p.valeurs.pst_surface),
      pst_prix_ttc_m2: prixAuM2(p.valeurs.pst_ttc, p.valeurs.pst_surface),
    };
  }

  const lignesRetenues = [
    ['Coût total des travaux à réaliser', travauxHT],
    ['Honoraires d’assistance à maîtrise d’ouvrage', num(v.fin_honoraires_amo)],
    ['Honoraires de maîtrise d’œuvre', num(v.fin_honoraires_moe)],
    ['Financement', totalRessources],
  ].filter(([, m]) => m > 0).map(([l]) => l);

  return {
    valeurs: {
      fin_travaux_ht: travauxHT,
      fin_travaux_ttc: travauxTTC,
      fin_eligibles_ht: somme(eligibles.map((p) => p.valeurs.pst_ht)),
      fin_eligibles_ttc: somme(eligibles.map((p) => p.valeurs.pst_ttc)),
      fin_depenses_ht: depensesHT,
      fin_depenses_ttc: depensesTTC,
      fin_pret: prets,
      fin_aides: subventions,
      fin_total_aides_publiques: totalAidesPubliques,
      fin_total_ressources: totalRessources,
      fin_reste_charge: resteCharge,
      fin_solde_projet: solde,
      fin_cases_marge: lignesRetenues,
      ene_gain_classes: classeAvant != null && classeApres != null ? classeAvant - classeApres : null,
      ene_ges_gain_classes: gesAvant != null && gesApres != null ? gesAvant - gesApres : null,
      ene_gain_pct: gainPct(v.ene_prim_avant, v.ene_prim_apres),
      ene_ges_gain_pct: gainPct(v.ene_ges_avant, v.ene_ges_apres),
    },
    lignesAides,
    autresAides,
    cout,
    coutTravaux,
    equilibre,
    parPoste,
  };
}

// Écart devis-factures, poste par poste (appariés par identifiant, conservé à la duplication) et au total.
export function ecarts(dossier) {
  const d = dossier.plans.devis;
  const f = dossier.plans.factures;
  if (!f) return null;
  const parId = new Map(d.postes.map((p) => [p.id, p]));
  const vus = new Set();
  const lignes = f.postes.map((p) => {
    const avant = parId.get(p.id);
    vus.add(p.id);
    return {
      id: p.id,
      intitule: p.valeurs.pst_intitule || (avant && avant.valeurs.pst_intitule) || '',
      devisHT: avant ? num(avant.valeurs.pst_ht) : 0,
      devisTTC: avant ? num(avant.valeurs.pst_ttc) : 0,
      factureHT: num(p.valeurs.pst_ht),
      factureTTC: num(p.valeurs.pst_ttc),
      origine: avant ? 'devis' : 'ajouté aux factures',
    };
  });
  for (const p of d.postes) {
    if (!vus.has(p.id)) {
      lignes.push({ id: p.id, intitule: p.valeurs.pst_intitule || '', devisHT: num(p.valeurs.pst_ht), devisTTC: num(p.valeurs.pst_ttc),
        factureHT: 0, factureTTC: 0, origine: 'retiré des factures' });
    }
  }
  for (const l of lignes) {
    l.pst_ecart_ht = centimes(l.factureHT - l.devisHT);
    l.pst_ecart_ttc = centimes(l.factureTTC - l.devisTTC);
  }
  return {
    lignes,
    fin_ecart_ht: somme(lignes.map((l) => l.pst_ecart_ht)),
    fin_ecart_ttc: somme(lignes.map((l) => l.pst_ecart_ttc)),
  };
}

// Valeurs calculées de niveau dossier.
export function calculerDossier(dossier, params = {}) {
  const v = dossier.valeurs;
  const devis = calculerPlan(dossier.plans.devis, params);
  const factures = calculerPlan(dossier.plans.factures, params);
  const e = ecarts(dossier);
  const devisHT = devis.valeurs.fin_travaux_ht;
  const executes = lireNombre(v.ent_travaux_executes_ht);
  const siret = String(v.ent_siret || '').replace(/\D/g, '');
  const declarant = [
    [v.prop_civilite, v.prop_nom, v.prop_prenom].filter((x) => !estVide(x)).join(' '),
    adresseDemandeur(dossier),
    v.prop_telephone,
  ].filter((x) => !estVide(x)).join(', ');
  return {
    devis,
    factures,
    ecarts: e,
    valeurs: {
      fin_devis_fige: dossier.fige ? `Figé le ${fmtDate(dossier.fige.date)}` : 'Non figé',
      fin_subv_total_prev: devis.valeurs.fin_aides,
      fin_subv_total_reel: factures ? factures.valeurs.fin_aides : null,
      fin_ecart_ht: e ? e.fin_ecart_ht : null,
      fin_ecart_ttc: e ? e.fin_ecart_ttc : null,
      ent_devis_ht: devisHT,
      ent_pct_executes: executes != null && devisHT > 0 ? Math.round((executes / devisHT) * 1000) / 10 : null,
      ent_siren: siret.length >= 9 ? siret.slice(0, 9) : null,
      acp_declarant: declarant || null,
    },
  };
}

// Valeur calculée d'un champ, pour un plan donné.
export function valeurCalculee(calc, id, planId = 'devis') {
  if (id in calc.valeurs) return calc.valeurs[id];
  const p = calc[planId];
  if (p && id in p.valeurs) return p.valeurs[id];
  return null;
}

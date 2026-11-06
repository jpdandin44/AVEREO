// Lecture et mise en forme des valeurs pour la fiche et les aperçus.
import { createContext, useContext, useSyncExternalStore } from 'react';
import { CHAMP, valeur } from '../lib/modele.js';
import { valeurCalculee } from '../lib/calculs.js';
import { eur, estVide, fmtDate, fmtNombre, lireNombre } from '../lib/nombres.js';
import { DEPENDANCES } from '../lib/documents.js';

export const StoreContext = createContext(null);

export function useStore(selecteur) {
  const store = useContext(StoreContext);
  return useSyncExternalStore(store.subscribe, () => selecteur(store.getState()));
}

export function useActions() {
  return useContext(StoreContext).actions;
}

// Valeur d'un champ dans un contexte { dossier, calc, parametres } pour un plan donné.
export function lireValeur(ctx, id, planId = 'devis') {
  const c = CHAMP[id];
  if (!c) return null;
  if (c.onglet === 'parametres') return ctx.parametres ? ctx.parametres[id] : null;
  if (c.saisie === 'calcule') return valeurCalculee(ctx.calc, id, planId);
  return valeur(ctx.dossier, id, planId);
}

const FORMAT_CALCULE = {
  ene_gain_classes: 'classes', ene_ges_gain_classes: 'classes', ene_gain_pct: 'pct', ene_ges_gain_pct: 'pct', ent_pct_executes: 'pct',
  ent_siren: 'texte', acp_declarant: 'texte', fin_devis_fige: 'texte', fin_cases_marge: 'liste',
};

export function formater(id, v) {
  const c = CHAMP[id];
  if (v == null || estVide(v)) return null;
  const s = c ? c.saisie : 'texte';
  if (s === 'calcule') {
    const f = FORMAT_CALCULE[id] || 'eur';
    if (f === 'texte') return String(v);
    if (f === 'liste') return Array.isArray(v) ? (v.length ? v.join(' ; ') : null) : String(v);
    if (f === 'pct') return `${fmtNombre(v)} %`;
    if (f === 'classes') return `${v > 0 ? '+' : ''}${v} classe${Math.abs(v) > 1 ? 's' : ''}`;
    return eur(v);
  }
  if (s === 'montant') return lireNombre(v) == null ? String(v) : eur(lireNombre(v));
  if (s === 'date') return fmtDate(v);
  if (s === 'oui_non') return v === 'oui' ? 'Oui' : v === 'non' ? 'Non' : String(v);
  if (s === 'cases' || s === 'serie_dates') return (Array.isArray(v) ? v : [v]).map((x) => (s === 'serie_dates' ? fmtDate(x) : x)).join(' ; ');
  if (s === 'pourcentage') return `${v} %`;
  if (s === 'lignes_montants') return Array.isArray(v) ? v.map((l) => `${l.libelle || '—'} : ${eur(lireNombre(l.montant) ?? 0)}`).join(' ; ') : null;
  return String(v);
}

// Valeur affichée d'une entrée de journal.
export function formaterJournal(item, v) {
  if (v == null || estVide(v)) return '(vide)';
  if (!item.saisie) return String(v);
  return formater(item.champ, v) ?? String(v);
}

// Une valeur affichée est « modifiée » si la dernière modification la touche, directement ou par un calcul.
export function estModifie(derniere, cle, id) {
  if (!derniere) return false;
  if (cle && derniere.items.some((i) => i.cle === cle)) return true;
  const deps = DEPENDANCES[id];
  return !!deps && derniere.items.some((i) => deps.includes(i.champ));
}

export function cleDe(id, planId) {
  const c = CHAMP[id];
  return c && c.plan ? `plan:${planId}:${id}` : `dossier:${id}`;
}

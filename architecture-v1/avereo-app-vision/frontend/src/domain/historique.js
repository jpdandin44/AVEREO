// Annuler / rétablir (R34) : historique d'états immuables. Logique pure.

export const PROFONDEUR_MAX = 200;

/**
 * @template T
 * @typedef {{passe: T[], present: T, futur: T[]}} Historique
 */

/** @template T @param {T} etatInitial @returns {Historique<T>} */
export function creerHistorique(etatInitial) {
  return { passe: [], present: etatInitial, futur: [] };
}

/**
 * Enregistre un nouvel état ; efface les états « rétablissables ».
 * Un état identique à l'actuel (même référence) n'ajoute rien.
 * @template T @param {Historique<T>} h @param {T} etat @returns {Historique<T>}
 */
export function valider(h, etat) {
  if (etat === h.present) return h;
  const passe = [...h.passe, h.present].slice(-PROFONDEUR_MAX);
  return { passe, present: etat, futur: [] };
}

/** @template T @param {Historique<T>} h @returns {boolean} */
export function peutAnnuler(h) {
  return h.passe.length > 0;
}

/** @template T @param {Historique<T>} h @returns {boolean} */
export function peutRetablir(h) {
  return h.futur.length > 0;
}

/** @template T @param {Historique<T>} h @returns {Historique<T>} */
export function annuler(h) {
  if (!peutAnnuler(h)) return h;
  const passe = h.passe.slice(0, -1);
  return { passe, present: h.passe[h.passe.length - 1], futur: [h.present, ...h.futur] };
}

/** @template T @param {Historique<T>} h @returns {Historique<T>} */
export function retablir(h) {
  if (!peutRetablir(h)) return h;
  const [suivant, ...futur] = h.futur;
  return { passe: [...h.passe, h.present], present: suivant, futur };
}

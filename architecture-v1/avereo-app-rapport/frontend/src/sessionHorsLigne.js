// Rapport sans réseau (application installée sur Android) : logique pure, testée par sessionHorsLigne.test.js.
// Sur le téléphone, Rapport garde la dernière identité confirmée par le serveur pour rouvrir le brouillon local
// quand le réseau manque. Le serveur reste seul juge : toute sauvegarde en ligne exige une session valide.

export const CLE_IDENTITE = 'avereo-rapport-derniere-identite-v1';
export const DUREE_IDENTITE_MS = 30 * 24 * 60 * 60 * 1000;

/** Erreur due au réseau ou au serveur indisponible (et non à une session refusée). */
export function erreurReseau(error) {
  if (!error) return false;
  if (typeof error.status === 'number') return error.status >= 500;
  return error.code === 'network' || error.name === 'TypeError' || error.name === 'AbortError' || /fetch|network|réseau|load failed/i.test(error.message || '');
}

/** 'ok' | 'horsLigne' | 'expiree' d'après le résultat d'un appel à l'API. */
export function etatSession(error) {
  if (!error) return 'ok';
  if (error.status === 401 || error.status === 403) return 'expiree';
  if (erreurReseau(error)) return 'horsLigne';
  return 'ok';
}

function stockageDisponible(stockage) {
  return stockage && typeof stockage.getItem === 'function' && typeof stockage.setItem === 'function';
}

/** Mémorise l'identité confirmée par le serveur (mode CONNECT seulement). */
export function memoriserIdentite(stockage, { config, user }, maintenant = Date.now()) {
  if (!stockageDisponible(stockage) || config?.mode !== 'connect_gateway' || !user?.id) return false;
  try {
    stockage.setItem(CLE_IDENTITE, JSON.stringify({ config, user, memoriseLe: maintenant }));
    return true;
  } catch {
    return false;
  }
}

/** Identité mémorisée, ou null si absente, illisible, d'un autre mode ou de plus de 30 jours. */
export function lireIdentite(stockage, maintenant = Date.now()) {
  if (!stockageDisponible(stockage)) return null;
  try {
    const valeur = JSON.parse(stockage.getItem(CLE_IDENTITE) || 'null');
    if (valeur?.config?.mode !== 'connect_gateway' || !valeur?.user?.id) return null;
    if (typeof valeur.memoriseLe !== 'number' || maintenant - valeur.memoriseLe > DUREE_IDENTITE_MS) return null;
    return { config: valeur.config, user: valeur.user };
  } catch {
    return null;
  }
}

export function oublierIdentite(stockage) {
  try { stockage?.removeItem?.(CLE_IDENTITE); } catch { /* stockage indisponible */ }
}

/** Adresse de reconnexion : le portail CONNECT relance Rapport (même adresse que le sas serveur). */
export function lienReconnexion(portail) {
  try {
    const url = new URL(String(portail || ''));
    if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost' && !url.hostname.endsWith('.localhost')) return '/';
    url.searchParams.set('app', 'rapport');
    return url.toString();
  } catch {
    return '/';
  }
}

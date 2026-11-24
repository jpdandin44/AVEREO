// Dernière identité connue de cet appareil : permet de rouvrir l'application SANS réseau et de retrouver la bonne base locale.
// Elle ne prouve rien : le serveur reverifie la session à chaque envoi (cookie de passerelle CONNECT). Aucune donnée secrète.
const CLE = "avereo-vision.identite";

/** @param {Storage|undefined} [stockage] */
export function lireIdentiteConnue(stockage = globalThis.localStorage) {
  try {
    const valeur = JSON.parse(stockage?.getItem(CLE) ?? "null");
    return valeur && typeof valeur.provider === "string" && typeof valeur.id === "string" ? valeur : null;
  } catch {
    return null;
  }
}

/** @param {{provider: string, id: string, role?: string, modeAuth?: string}} identite */
export function memoriserIdentite(identite, stockage = globalThis.localStorage) {
  try {
    stockage?.setItem(CLE, JSON.stringify({ provider: identite.provider, id: identite.id, role: identite.role, modeAuth: identite.modeAuth }));
  } catch {
    /* navigation privée : on s'en passe */
  }
}

/** Déconnexion explicite : l'appareil n'ouvre plus l'application sans passer par CONNECT. Les données locales restent, cloisonnées par compte. */
export function oublierIdentite(stockage = globalThis.localStorage) {
  try {
    stockage?.removeItem(CLE);
  } catch {
    /* rien à faire */
  }
}

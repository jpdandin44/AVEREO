// Écritures locales en échec (espace insuffisant, base fermée…), par projet : partagé entre les relevés ouverts et le bandeau
// de nouvelle version, pour ne jamais recharger la page tant qu'une modification n'est pas écrite sur l'appareil.

const enEchec = new Set();
const ecouteurs = new Set();

/** @param {string} projetId @param {boolean} echec */
export function signalerEcriture(projetId, echec) {
  const avant = enEchec.has(projetId);
  if (echec) enEchec.add(projetId);
  else enEchec.delete(projetId);
  if (avant !== echec) ecouteurs.forEach((ecouteur) => ecouteur());
}

/** Nombre de relevés dont la dernière modification n'a pas pu être écrite sur l'appareil. */
export function ecrituresEnEchec() {
  return enEchec.size;
}

export function abonnerEcritures(ecouteur) {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
}

/**
 * Recharger la page (nouvelle version) peut-il faire perdre des modifications ?
 * Oui si une écriture locale a échoué, ou si le stockage n'est pas durable (mémoire seule) alors qu'il reste des envois en attente.
 * @param {{echecsEcriture: number, durable: boolean, enAttente: number}} etat
 */
export function rechargementRisque({ echecsEcriture, durable, enAttente }) {
  return echecsEcriture > 0 || (!durable && enAttente > 0);
}

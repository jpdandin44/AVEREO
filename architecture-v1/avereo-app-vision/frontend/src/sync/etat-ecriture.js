// Écritures locales non persistées, par projet : en cours (pas encore écrites dans IndexedDB) ou en échec (espace insuffisant,
// base fermée…). Partagé entre les relevés ouverts et le bandeau de nouvelle version, pour ne jamais recharger la page
// tant qu'une modification n'est pas écrite sur l'appareil.

/** @type {Map<string, {enCours: number, echec: boolean}>} */
const etats = new Map();
const ecouteurs = new Set();

function etatDe(projetId) {
  if (!etats.has(projetId)) etats.set(projetId, { enCours: 0, echec: false });
  return etats.get(projetId);
}

function changer(projetId, modifier) {
  const avant = ecrituresNonPersistees();
  modifier(etatDe(projetId));
  const e = etats.get(projetId);
  if (e.enCours === 0 && !e.echec) etats.delete(projetId);
  if (ecrituresNonPersistees() !== avant) ecouteurs.forEach((ecouteur) => ecouteur());
}

/** Une écriture locale commence (dès la modification, avant qu'IndexedDB ne l'ait reçue). */
export function ecritureCommencee(projetId) {
  changer(projetId, (e) => {
    e.enCours += 1;
  });
}

/** L'écriture est terminée : réussie (efface l'échec du projet) ou échouée (le projet reste « à risque » jusqu'à une réussite). */
export function ecritureTerminee(projetId, reussie) {
  changer(projetId, (e) => {
    e.enCours = Math.max(0, e.enCours - 1);
    e.echec = !reussie;
  });
}

/** Le relevé est fermé : on oublie son état. */
export function oublierEcritures(projetId) {
  changer(projetId, (e) => {
    e.enCours = 0;
    e.echec = false;
  });
}

/** Nombre de relevés ayant une modification pas encore écrite sur l'appareil (en cours ou en échec). */
export function ecrituresNonPersistees() {
  return etats.size;
}

export function abonnerEcritures(ecouteur) {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
}

/**
 * Recharger la page (nouvelle version) peut-il faire perdre des modifications ?
 * Oui si une écriture locale est en cours ou a échoué, ou si le stockage n'est pas durable (mémoire seule) alors qu'il reste
 * des envois en attente.
 * @param {{nonPersistees: number, durable: boolean, enAttente: number}} etat
 */
export function rechargementRisque({ nonPersistees, durable, enAttente }) {
  return nonPersistees > 0 || (!durable && enAttente > 0);
}

// Stockage durable de l'appareil (R04) : demande au navigateur de ne pas effacer les données locales (relevés non envoyés)
// et lit l'espace disponible. Sur iPhone, Safari peut effacer les données d'un site peu utilisé : d'où l'avertissement.
// Logique pure : le navigateur est injecté (tests sous Node).

export const SEUIL_PRESQUE_PLEIN = 0.8;

/**
 * @param {{storage?: {persist?: () => Promise<boolean>, persisted?: () => Promise<boolean>, estimate?: () => Promise<{usage?: number, quota?: number}>}}} [navigateur]
 * @returns {Promise<{persistant: boolean|null, utilise: number|null, quota: number|null, alerte: null|"non-garanti"|"presque-plein"}>}
 */
export async function verifierStockage(navigateur = globalThis.navigator) {
  const stockage = navigateur?.storage;
  let persistant = null;
  try {
    if (stockage?.persisted && (await stockage.persisted())) persistant = true;
    else if (stockage?.persist) persistant = await stockage.persist();
  } catch {
    persistant = null;
  }
  let utilise = null;
  let quota = null;
  try {
    const estimation = await stockage?.estimate?.();
    utilise = Number.isFinite(estimation?.usage) ? estimation.usage : null;
    quota = Number.isFinite(estimation?.quota) && estimation.quota > 0 ? estimation.quota : null;
  } catch {
    /* estimation indisponible : on ne conclut rien */
  }
  let alerte = null;
  if (utilise !== null && quota !== null && utilise / quota >= SEUIL_PRESQUE_PLEIN) alerte = "presque-plein";
  else if (persistant === false) alerte = "non-garanti";
  return { persistant, utilise, quota, alerte };
}

const enMo = (octets) => `${Math.round(octets / 1_000_000).toLocaleString("fr-FR")} Mo`;

/** Texte de l'encadré (libellé + message), ou null s'il n'y a rien à signaler. */
export function decrireStockage(etat) {
  if (etat.alerte === "presque-plein") {
    return {
      titre: "Espace de stockage presque plein",
      message: `Cet appareil a utilisé ${enMo(etat.utilise)} sur ${enMo(etat.quota)} disponibles pour AVEREO Vision. Envoyez vos relevés (réseau) et libérez de l'espace avant de poursuivre la saisie hors ligne.`,
    };
  }
  if (etat.alerte === "non-garanti") {
    return {
      titre: "Stockage de l'appareil non garanti",
      message: "Le navigateur peut effacer les données locales de ce site s'il manque de place ou s'il n'est pas utilisé pendant longtemps. Synchronisez régulièrement ; sur iPhone, installez l'application sur l'écran d'accueil.",
    };
  }
  return null;
}

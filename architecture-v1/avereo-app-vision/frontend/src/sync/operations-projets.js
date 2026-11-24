// Opérations sur les projets faites hors ligne (création, renommage, archivage) : file d'envoi des projets.
// Logique pure (aucun réseau, aucun stockage). Voir docs/synchronisation.md §5.
//
// Une opération : {type: "creer", id, champs: {name, address, client_label}}
//              ou {type: "modifier", id, champs: {name?, address?, client_label?, status?}}

const CHAMPS_DESCRIPTIFS = ["name", "address", "client_label"];

/** Identifiant de projet choisi par le navigateur : 32 caractères hexadécimaux minuscules (128 bits). @param {(octets: Uint8Array) => Uint8Array} [remplir] */
export function genererIdProjet(remplir = (octets) => globalThis.crypto.getRandomValues(octets)) {
  return Array.from(remplir(new Uint8Array(16)), (o) => o.toString(16).padStart(2, "0")).join("");
}

/** Sépare les champs descriptifs (nom, adresse, client) du statut. */
function separer(champs) {
  const descriptifs = {};
  for (const cle of CHAMPS_DESCRIPTIFS) if (champs[cle] !== undefined) descriptifs[cle] = champs[cle];
  const statut = champs.status !== undefined ? { status: champs.status } : null;
  return { descriptifs, statut };
}

/**
 * Ajoute une opération à la file en la regroupant avec celles du même projet :
 *  - une modification de nom, d'adresse ou de client s'ajoute à la création en attente (le serveur n'en voit qu'une) ;
 *  - le statut (archivage) reste une modification à part, qui suit la création ;
 *  - deux modifications du même projet se fondent en une seule (la dernière valeur de chaque champ).
 * @param {any[]} operations @param {any} operation @returns {any[]}
 */
export function empilerOperation(operations, operation) {
  if (operation.type === "creer") {
    return [...operations.filter((o) => !(o.type === "creer" && o.id === operation.id)), { type: "creer", id: operation.id, champs: { ...operation.champs } }];
  }
  const { descriptifs, statut } = separer(operation.champs);
  let suite = operations.map((o) => ({ ...o, champs: { ...o.champs } }));
  const creation = suite.find((o) => o.type === "creer" && o.id === operation.id);
  let aPlacer = { ...descriptifs, ...(statut ?? {}) };
  if (creation) {
    Object.assign(creation.champs, descriptifs);
    aPlacer = statut ?? {};
  }
  if (Object.keys(aPlacer).length === 0) return suite;
  const existante = suite.find((o) => o.type === "modifier" && o.id === operation.id);
  if (existante) Object.assign(existante.champs, aPlacer);
  else suite = [...suite, { type: "modifier", id: operation.id, champs: aPlacer }];
  return suite;
}

/**
 * Retire de la file l'opération qui vient d'être envoyée. Si elle a changé pendant l'envoi (un renommage s'y est ajouté),
 * elle reste dans la file pour être renvoyée : on ne perd jamais une modification faite pendant un envoi.
 */
export function retirerOperation(operations, operation) {
  const cle = JSON.stringify(operation.champs);
  const index = operations.findIndex((o) => o.type === operation.type && o.id === operation.id && JSON.stringify(o.champs) === cle);
  return index < 0 ? operations : operations.filter((_, i) => i !== index);
}

/** Applique à une ligne de projet les opérations encore en attente : la liste montre toujours l'intention locale. */
export function appliquerOperations(projet, operations) {
  let resultat = projet;
  for (const operation of operations) {
    if (operation.id === projet.id) resultat = { ...resultat, ...operation.champs };
  }
  return resultat;
}

/** Ajoute « etat » à chaque projet : « a-creer », « a-modifier » ou « synchronise ». */
export function annoterProjets(projets, operations) {
  return projets.map((projet) => {
    const enAttente = operations.filter((o) => o.id === projet.id);
    const etat = enAttente.some((o) => o.type === "creer") ? "a-creer" : enAttente.length > 0 ? "a-modifier" : "synchronise";
    return { ...projet, etat };
  });
}

/** Champs que le serveur doit encore recevoir pour égaler l'intention locale (après un rejeu de création qui renvoie le projet existant). */
export function ecartsDescriptifs(local, serveur) {
  const ecarts = {};
  for (const cle of CHAMPS_DESCRIPTIFS) if (local[cle] !== undefined && local[cle] !== serveur[cle]) ecarts[cle] = local[cle];
  return ecarts;
}

/**
 * Contrôle local des champs d'un projet, avec les mêmes limites que le serveur (160, 500 et 200 caractères) : un refus
 * définitif du serveur après coup serait une mauvaise surprise hors ligne. Retourne les erreurs par champ ({} si tout va bien).
 * @param {{name?: any, address?: any, client_label?: any}} champs @param {{creation: boolean}} options
 */
export function validerChampsProjet(champs, { creation }) {
  const erreurs = {};
  const texte = (cle, max, obligatoire) => {
    if (champs[cle] === undefined) {
      if (obligatoire) erreurs[cle] = "Champ obligatoire.";
      return;
    }
    if (typeof champs[cle] !== "string") erreurs[cle] = "Texte attendu.";
    else if (obligatoire && champs[cle].trim() === "") erreurs[cle] = "Ne peut pas être vide.";
    else if ([...champs[cle].trim()].length > max) erreurs[cle] = `Au plus ${max} caractères.`;
  };
  texte("name", 160, creation);
  if (!creation && champs.name !== undefined && typeof champs.name === "string" && champs.name.trim() === "") erreurs.name = "Ne peut pas être vide.";
  texte("address", 500, false);
  texte("client_label", 200, false);
  return erreurs;
}

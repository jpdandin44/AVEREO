// Adresse du portail AVEREO CONNECT pour le menu commun « Mon compte ».
// Le composant <avereo-account-menu> lit <meta name="avereo-connect-portal"> à son insertion ; sa propriété « portal »
// n'est qu'en lecture : React 19 ne doit donc pas la recevoir en prop (page blanche constatée en recette le 26/11/2026).

/**
 * Pose (ou met à jour) la balise meta du portail avant l'affichage du menu. Sans adresse, retire la balise.
 * @param {string | undefined} url
 * @param {Document} [doc]
 */
export function definirPortailConnect(url, doc = globalThis.document) {
  if (!doc?.head) return;
  let meta = doc.head.querySelector('meta[name="avereo-connect-portal"]');
  if (!url) {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = doc.createElement("meta");
    meta.setAttribute("name", "avereo-connect-portal");
    doc.head.append(meta);
  }
  meta.setAttribute("content", url);
}

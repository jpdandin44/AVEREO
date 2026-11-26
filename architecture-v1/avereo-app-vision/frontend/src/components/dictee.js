// Dictée dans les champs libres : Vision n'envoie aucun son à un service extérieur (décision du responsable du 26/11/2026).
// On s'appuie sur la dictée du système de l'appareil ; ce module dit quel geste faire selon l'appareil. Logique pure, testée.

/**
 * @param {{userAgent?: string, maxTouchPoints?: number}} env
 * @returns {string}
 */
export function conseilDictee({ userAgent = "", maxTouchPoints = 0 } = {}) {
  if (/Android/i.test(userAgent)) {
    return "Touchez le micro du clavier pour dicter (dictée Gboard ou du clavier installé).";
  }
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) {
    return "Touchez le micro du clavier pour dicter (activer si besoin : Réglages › Général › Clavier › Dictée).";
  }
  if (/Windows/i.test(userAgent)) {
    return "Appuyez sur Windows + H pour dicter (ou le micro du clavier tactile de la Surface).";
  }
  if (/Macintosh/i.test(userAgent)) {
    return "Appuyez deux fois sur la touche Fn (ou Contrôle) pour dicter avec la dictée du Mac.";
  }
  return "Utilisez la dictée de votre appareil (micro du clavier) pour remplir ce champ.";
}

export function conseilDicteeCourant() {
  const nav = globalThis.navigator ?? {};
  return conseilDictee({ userAgent: nav.userAgent, maxTouchPoints: nav.maxTouchPoints });
}

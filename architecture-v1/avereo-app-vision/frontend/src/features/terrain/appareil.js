// Choix de l'appareil photo (R38). Logique pure, testée.
// Sur Android et iPhone/iPad, `<input type="file" capture>` ouvre l'appareil photo natif (meilleure qualité, mise au point).
// Sur PC et tablettes Windows (Surface Pro…), les navigateurs ignorent `capture` et ouvrent un sélecteur de fichiers :
// on utilise alors la caméra du navigateur (getUserMedia) dans une fenêtre de prise de vue intégrée à Vision.

/**
 * @param {{userAgent?: string, maxTouchPoints?: number, getUserMedia?: unknown}} env
 * @returns {"natif" | "integre"}
 */
export function choisirModeAppareil({ userAgent = "", maxTouchPoints = 0, getUserMedia } = {}) {
  const telephone = /Android|iPhone|iPad|iPod/i.test(userAgent)
    // iPadOS se présente comme un Mac de bureau : on le reconnaît à son écran tactile.
    || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  if (telephone) return "natif";
  return typeof getUserMedia === "function" ? "integre" : "natif";
}

/** Environnement courant du navigateur. */
export function modeAppareilCourant() {
  const nav = globalThis.navigator ?? {};
  return choisirModeAppareil({
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints,
    getUserMedia: nav.mediaDevices?.getUserMedia?.bind(nav.mediaDevices),
  });
}

/** Message lisible pour un refus ou une absence de caméra (DOMException.name). */
export function messageErreurCamera(nom) {
  if (nom === "NotAllowedError" || nom === "SecurityError") {
    return "L'accès à la caméra est refusé. Autorisez la caméra pour ce site dans le navigateur, ou utilisez « Choisir une photo ».";
  }
  if (nom === "NotFoundError" || nom === "OverconstrainedError") {
    return "Aucune caméra disponible sur cet appareil. Utilisez « Choisir une photo ».";
  }
  if (nom === "NotReadableError") {
    return "La caméra est déjà utilisée par une autre application. Fermez-la puis réessayez, ou utilisez « Choisir une photo ».";
  }
  return "La caméra n'a pas pu démarrer. Utilisez « Choisir une photo ».";
}

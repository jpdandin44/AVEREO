// Konva dessine sur un canvas, qui ne comprend pas les variables CSS : on lit les jetons de la charte
// (déclarés une seule fois dans styles/tokens.css) au moment de l'affichage.

/** @returns {{primary: string, accent: string, surface: string, muted: string, text: string, textMuted: string,
 *   corporate: string, gris: string, fontMono: string, fontUi: string}} */
export function lireJetons() {
  const style = getComputedStyle(document.documentElement);
  const v = (nom) => style.getPropertyValue(`--${nom}`).trim();
  return {
    primary: v("brand-primary"),
    accent: v("brand-accent"),
    surface: v("surface"),
    muted: v("surface-muted"),
    text: v("text-primary"),
    textMuted: v("text-muted"),
    corporate: v("surface-corporate"),
    gris: v("gris-mineral"),
    fontMono: v("font-mono"),
    fontUi: v("font-ui"),
  };
}

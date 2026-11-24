// Contrôles automatiques de la charte graphique AVEREO V2.0 : R10 (jetons), R11 (polices, logo), R12 (accessibilité).
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), ".."); // frontend/
const src = join(racine, "src");
const logosCharte = join(racine, "..", "docs", "charte", "logos");

function fichiers(dossier, extensions) {
  const resultat = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) resultat.push(...fichiers(chemin, extensions));
    else if (extensions.some((e) => nom.endsWith(e))) resultat.push(chemin);
  }
  return resultat;
}

const tokensCss = readFileSync(join(src, "styles", "tokens.css"), "utf8");
const baseCss = readFileSync(join(src, "styles", "base.css"), "utf8");

/** Variables CSS déclarées dans tokens.css. */
function lireJetons(css) {
  const jetons = {};
  for (const [, nom, valeur] of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    jetons[nom] = valeur.replace(/\/\*.*?\*\//g, "").trim();
  }
  return jetons;
}
const jetons = lireJetons(tokensCss);

test("R10 : les jetons de la charte ont les valeurs de la charte V2.0", () => {
  const attendus = {
    "brand-primary": "#002B45",
    "brand-accent": "#FF6600",
    surface: "#FFFFFF",
    "surface-muted": "#EEF3F6",
    "text-primary": "#263238",
    "text-muted": "#64748B",
    "surface-corporate": "#345469",
    "gris-mineral": "#D9D9D9",
    radius: "8px",
  };
  for (const [nom, valeur] of Object.entries(attendus)) {
    assert.equal(String(jetons[nom]).toUpperCase(), valeur.toUpperCase(), `--${nom}`);
  }
});

test("R10 : aucun code couleur en dur hors de tokens.css", () => {
  const motifs = [/#[0-9a-fA-F]{3,8}\b/, /\brgba?\s*\(/, /\bhsla?\s*\(/];
  const fautes = [];
  for (const fichier of fichiers(src, [".css", ".js", ".jsx"])) {
    if (fichier.endsWith(join("styles", "tokens.css"))) continue;
    const texte = readFileSync(fichier, "utf8");
    for (const motif of motifs) {
      if (motif.test(texte)) fautes.push(`${relative(racine, fichier)} : ${motif}`);
    }
  }
  assert.deepEqual(fautes, []);
  // index.html : seule la balise theme-color (qui n'accepte pas de variable CSS) répète la couleur primaire.
  const html = readFileSync(join(racine, "index.html"), "utf8");
  const couleursHtml = [...html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toUpperCase());
  assert.deepEqual(couleursHtml, [jetons["brand-primary"].toUpperCase()]);
});

test("R11 : le logo affiché est identique aux fichiers fournis (empreinte SHA-256)", () => {
  for (const nom of ["logo-avereo.svg", "logo-avereo.png"]) {
    const original = createHash("sha256").update(readFileSync(join(logosCharte, nom))).digest("hex");
    const copie = createHash("sha256").update(readFileSync(join(racine, "public", "branding", nom))).digest("hex");
    assert.equal(copie, original, `${nom} a été modifié`);
  }
});

test("R11 : logo d'au moins 220 px de large, avec une marge", () => {
  const regle = baseCss.match(/\.logo\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(regle, /width:\s*220px/);
  assert.match(regle, /min-width:\s*220px/);
  assert.match(regle, /margin:\s*8px/); // ≥ 10 % de la hauteur (≈ 67 px à 220 px de large)
});

test("R11 : Inter pour l'interface, JetBrains Mono pour les cotes, deux familles au plus", () => {
  assert.match(jetons["font-ui"], /^"Inter",\s*Arial,\s*sans-serif$/);
  assert.match(jetons["font-mono"], /^"JetBrains Mono",\s*Consolas,\s*monospace$/);
  for (const fichier of fichiers(src, [".css"])) {
    if (fichier.endsWith(join("styles", "tokens.css"))) continue;
    for (const [, valeur] of readFileSync(fichier, "utf8").matchAll(/font-family\s*:\s*([^;]+);/g)) {
      assert.match(valeur.trim(), /^var\(--font-(ui|mono)\)$|^inherit$/, `${relative(racine, fichier)} : ${valeur}`);
    }
  }
  const principal = readFileSync(join(src, "main.jsx"), "utf8");
  assert.match(principal, /@fontsource\/inter\//);
  assert.match(principal, /@fontsource\/jetbrains-mono\//);
  assert.doesNotMatch(readFileSync(join(racine, "index.html"), "utf8"), /fonts\.googleapis|fonts\.gstatic/);
});

// ---------- R12 : accessibilité ----------
function rvb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]) {
  const canal = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a, b) {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}

function melange(couleur, avec, partCouleur) {
  return couleur.map((c, i) => Math.round(c * partCouleur + avec[i] * (1 - partCouleur)));
}

test("R12 : contraste d'au moins 4,5:1 pour tous les couples texte / fond utilisés", () => {
  const c = (nom) => rvb(jetons[nom]);
  const alerteFond = melange(c("brand-accent"), c("surface"), 0.12); // color-mix(12 % d'accent dans le blanc)
  const couples = [
    ["texte courant sur fond blanc", c("text-primary"), c("surface")],
    ["texte courant sur fond brume", c("text-primary"), c("surface-muted")],
    ["texte courant sur encadré d'alerte", c("text-primary"), alerteFond],
    ["titre bleu nuit sur encadré d'alerte", c("brand-primary"), alerteFond],
    ["texte secondaire sur fond blanc", c("text-muted"), c("surface")],
    ["en-tête de tableau : blanc sur bleu nuit", c("surface"), c("brand-primary")],
    ["bouton principal : blanc sur bleu nuit", c("surface"), c("brand-primary")],
    ["bouton orange : bleu nuit sur orange", c("brand-primary"), c("brand-accent")],
    ["titre bleu nuit sur fond blanc", c("brand-primary"), c("surface")],
    ["titre bleu nuit sur fond brume", c("brand-primary"), c("surface-muted")],
  ];
  for (const [nom, texte, fond] of couples) {
    assert.ok(contraste(texte, fond) >= 4.5, `${nom} : ${contraste(texte, fond).toFixed(2)}:1`);
  }
});

test("R12 : jamais de texte courant orange ; le bouton orange porte un texte bleu nuit", () => {
  for (const fichier of fichiers(src, [".css"])) {
    if (fichier.endsWith(join("styles", "tokens.css"))) continue;
    const css = readFileSync(fichier, "utf8");
    assert.doesNotMatch(css, /(^|[;{\s])color\s*:\s*var\(--brand-accent\)/m, `${relative(racine, fichier)} : texte orange`);
  }
  const regleAccent = baseCss.match(/\.bouton--accent\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(regleAccent, /background:\s*var\(--brand-accent\)/);
  assert.match(regleAccent, /(^|[;\s])color:\s*var\(--brand-primary\)/);
});

test("R13/R12 : les cibles tactiles minimales sont déclarées à 48 px", () => {
  assert.equal(jetons["cible-min"], "48px");
  const regleBouton = baseCss.match(/\.bouton\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(regleBouton, /min-height:\s*var\(--cible-min\)/);
  const regleChamp = baseCss.match(/\.champ__saisie\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(regleChamp, /min-height:\s*var\(--cible-min\)/);
});

test("la charte interdit dégradés, halos et effets décoratifs", () => {
  for (const fichier of fichiers(src, [".css"])) {
    const css = readFileSync(fichier, "utf8");
    assert.doesNotMatch(css, /gradient\s*\(/, `${relative(racine, fichier)} : dégradé`);
    assert.doesNotMatch(css, /blur\s*\(|text-shadow|drop-shadow/, `${relative(racine, fichier)} : halo`);
  }
});

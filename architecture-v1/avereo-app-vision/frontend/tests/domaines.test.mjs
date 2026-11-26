// R08 : les relevés restent sur les serveurs AVEREO. Le menu appelle le portail CONNECT AVEREO.
// Inventaire autorisé : AVEREO en HTTPS et adresses locales de développement.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

function fichiers(dossier, extensions) {
  const resultat = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) resultat.push(...fichiers(chemin, extensions));
    else if (extensions.some((e) => nom.endsWith(e))) resultat.push(chemin);
  }
  return resultat;
}

const AUTORISEES = [/^https:\/\/(?:[a-z0-9-]+\.)*avereo\.fr(?:\/|$)/, /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/];

test("R08 : aucune adresse externe dans le code source, la page d'accueil ni le dossier public", () => {
  const fichiersATester = [
    ...fichiers(join(racine, "src"), [".js", ".jsx", ".css"]),
    ...fichiers(join(racine, "public"), [".json", ".webmanifest", ".html", ".js", ".css"]),
    join(racine, "index.html"),
    join(racine, "vite.config.js"),
  ];
  const trouvees = [];
  for (const fichier of fichiersATester) {
    const texte = readFileSync(fichier, "utf8");
    for (const adresse of texte.match(/(https?:)?\/\/[a-z0-9][a-z0-9.-]*\.[a-z]{2,}[^\s"'`)<>]*|https?:\/\/[^\s"'`)<>]+/gi) ?? []) {
      if (!AUTORISEES.some((motif) => motif.test(adresse))) trouvees.push(`${relative(racine, fichier)} : ${adresse}`);
    }
  }
  assert.deepEqual(trouvees, []);
});

test("R08 : le client d'API n'appelle que des chemins relatifs du même site", () => {
  const client = readFileSync(join(racine, "src", "services", "api.js"), "utf8");
  assert.match(client, /base = "\/api\/"/);
  assert.doesNotMatch(client, /fetch\(\s*["'`]https?:/);
});

test("R08 : le jeton de test n'est lu que par `npm run dev` (jamais embarqué dans un build)", () => {
  const client = readFileSync(join(racine, "src", "services", "api.js"), "utf8");
  const lecture = client.indexOf("import.meta.env.VITE_LOCAL_API_TOKEN");
  const garde = client.indexOf("import.meta.env.DEV");
  assert.ok(garde !== -1 && lecture !== -1 && garde < lecture, "le jeton doit être lu après un test import.meta.env.DEV");
  const gitignore = readFileSync(join(racine, "..", ".gitignore"), "utf8");
  assert.match(gitignore, /\.env\*\.local|\.env\.development\.local/);
});

test("R08 : le logo SVG fourni ne charge rien (ses adresses sont des espaces de noms XML, pas des requêtes)", () => {
  for (const fichier of fichiers(join(racine, "public"), [".svg"])) {
    const texte = readFileSync(fichier, "utf8");
    assert.doesNotMatch(texte, /<script|<image[^>]*href=|<use[^>]*href=["']https?:|@import|url\(\s*["']?https?:/i, relative(racine, fichier));
  }
});

// Contrat client/serveur : l'envoi produit par le client pour REF-2 est figé dans tests/fixtures/sync/ref2-envoi.json ;
// le même fichier est validé et rejoué par les tests PHP de l'API (tests/api/sync_test.php). Un changement de format casse les deux côtés.
// Pour régénérer le fichier après une évolution VOULUE du protocole : UPDATE_FIXTURES=1 node --test tests/sync-protocole.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ajouterOuverture, ajouterPiece, creerOuverture, creerPieceRectangulaire, remplacerNiveau, remplacerPiece } from "../src/domain/modele.js";
import { diffBatiment } from "../src/sync/diff.js";
import { empiler, fileVide } from "../src/sync/file-envoi.js";
import { batimentParDefaut, versFil } from "../src/sync/moteur.js";

const FICHIER = new URL("../../tests/fixtures/sync/ref2-envoi.json", import.meta.url);

/** REF-2 : pièce 4,00 × 3,00 m, hauteur 2,50 m, porte 0,90 × 2,04 m et fenêtre 1,20 × 1,00 m (allège 0,90 m). */
function ref2() {
  const base = batimentParDefaut();
  let piece = creerPieceRectangulaire({ id: "piece-salon", nom: "Salon", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
  piece = ajouterOuverture(piece, creerOuverture({ id: "ouv-1-porte", type: "porte", murIndex: 0, positionMm: 500 }));
  piece = ajouterOuverture(piece, creerOuverture({ id: "ouv-2-fenetre", type: "fenetre", murIndex: 1, positionMm: 600 }));
  return remplacerNiveau(base, ajouterPiece(base.niveaux[0], piece));
}

function envoiRef2() {
  const file = empiler(fileVide(), diffBatiment(null, ref2()), () => 0);
  return { device_id: "telephone-0001", since: 0, changes: file.map(versFil) };
}

test("protocole : l'envoi du client pour REF-2 est conforme au fichier de référence partagé avec les tests PHP", () => {
  const envoi = envoiRef2();
  if (process.env.UPDATE_FIXTURES === "1") fs.writeFileSync(FICHIER, `${JSON.stringify(envoi, null, 2)}\n`);
  const reference = JSON.parse(fs.readFileSync(FICHIER, "utf8"));
  assert.deepEqual(envoi, reference);
  assert.equal(envoi.changes.length, 5, "bâtiment, niveau, pièce, porte, fenêtre");
  assert.deepEqual(envoi.changes.map((c) => c.base_rev), [0, 0, 0, 0, 0]);
  assert.equal(envoi.changes[3].data.largeurMm, 900);
  assert.equal(envoi.changes[4].data.alleMm, 900);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  ajouterNiveau, ajouterPiece, creerBatiment, creerNiveau, creerPieceRectangulaire, remplacerNiveau, remplacerPiece,
} from "../src/domain/modele.js";
import { diffBatiment } from "../src/sync/diff.js";
import { acquitter, empiler, fileVide, prendreLot, retirer } from "../src/sync/file-envoi.js";

const changement = (objectId, nom = "Maison") => ({ objectId, kind: "batiment", parentId: null, data: { nom }, deleted: false });

test("une file vide est un nouveau tableau indépendant à chaque appel", () => {
  assert.deepEqual(fileVide(), []);
  assert.notStrictEqual(fileVide(), fileVide());
});

test("deux changements du même objet gardent la dernière valeur et le premier baseRev, version 2", () => {
  const initiale = empiler(fileVide(), [changement("b", "Avant")], () => 3);
  const file = empiler(initiale, [changement("b", "Après")], () => 9);
  assert.deepEqual(file, [{ ...changement("b", "Après"), baseRev: 3, version: 2 }]);
  assert.deepEqual(initiale, [{ ...changement("b", "Avant"), baseRev: 3, version: 1 }]);
});

test("plusieurs changements dans le même appel sont regroupés dans l'ordre de première apparition", () => {
  const file = empiler([], [changement("b"), changement("a"), changement("b", "Renommé")], () => 1);
  assert.deepEqual(file.map((entree) => [entree.objectId, entree.version]), [["b", 2], ["a", 1]]);
  assert.equal(file[0].data.nom, "Renommé");
});

test("une création puis une suppression avant l'envoi s'annulent", () => {
  const creation = changement("b");
  const suppression = { ...creation, data: null, deleted: true };
  assert.deepEqual(empiler([], [creation, suppression], () => 0), []);
  const initiale = empiler([], [creation], () => 0);
  assert.deepEqual(empiler(initiale, [suppression], () => 0), []);
  assert.equal(initiale.length, 1);
});

test("la suppression d'un objet déjà connu reste dans la file avec sa première révision", () => {
  const initiale = empiler([], [changement("b")], () => 4);
  assert.deepEqual(empiler(initiale, [{ ...changement("b"), data: null, deleted: true }], () => 8), [{
    ...changement("b"), data: null, deleted: true, baseRev: 4, version: 2,
  }]);
});

test("prendreLot respecte max et la limite par défaut de cent sans modifier la file", () => {
  const file = empiler([], Array.from({ length: 105 }, (_, i) => changement(`b-${i}`)), () => 0);
  const copie = structuredClone(file);
  assert.deepEqual(prendreLot(file, 2), file.slice(0, 2));
  assert.deepEqual(prendreLot(file, 0), []);
  assert.equal(prendreLot(file).length, 100);
  assert.equal(prendreLot(file, 200).length, 105);
  assert.deepEqual(file, copie);
});

test("acquitter retire une entrée envoyée de même version et conserve les absentes des appliqués", () => {
  const file = empiler([], [changement("a"), changement("b")], () => 1);
  assert.deepEqual(acquitter(file, prendreLot(file), [{ object_id: "a", rev: 2 }]), [file[1]]);
  assert.deepEqual(acquitter(file, prendreLot(file), []), file);
});

test("acquitter garde une modification faite pendant l'envoi, avec baseRev relevé et version conservée", () => {
  const initiale = empiler([], [changement("a", "Envoyé")], () => 1);
  const envoyes = prendreLot(initiale);
  const courante = empiler(initiale, [changement("a", "Modifié pendant l'envoi")], () => 1);
  assert.deepEqual(acquitter(courante, envoyes, [{ object_id: "a", rev: 2 }]), [{
    ...changement("a", "Modifié pendant l'envoi"), baseRev: 2, version: 2,
  }]);
});

test("acquitter ne touche pas aux entrées qui ne faisaient pas partie de l'envoi", () => {
  const file = empiler([], [changement("a"), changement("b")], () => 1);
  assert.deepEqual(acquitter(file, prendreLot(file, 1), [{ object_id: "b", rev: 2 }]), file);
});

test("retirer supprime uniquement les identifiants demandés et conserve l'ordre", () => {
  const file = empiler([], [changement("c"), changement("a"), changement("b")], () => 1);
  assert.deepEqual(retirer(file, ["a", "inconnu", "a"]), [file[0], file[2]]);
  assert.deepEqual(retirer(file, []), file);
});

test("les opérations de file ne modifient ni la file, ni les changements, ni l'envoi, ni les acquittements", () => {
  const changements = [changement("a"), changement("b")];
  const file = empiler([], changements, () => 1);
  const envoyes = prendreLot(file);
  const appliques = [{ object_id: "a", rev: 2 }];
  const copies = structuredClone({ changements, file, envoyes, appliques });
  empiler(file, [changement("a", "Après")], () => 1);
  acquitter(file, envoyes, appliques);
  retirer(file, ["b"]);
  assert.deepEqual({ changements, file, envoyes, appliques }, copies);
});

test("deux appareils : renommage et changement de hauteur gardent chacun baseRev 1 et des données distinctes", () => {
  const piece = creerPieceRectangulaire({ id: "piece-1", nom: "Salon", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
  const initial = ajouterNiveau(creerBatiment({ id: "batiment-1", nom: "Maison" }),
    ajouterPiece(creerNiveau({ id: "niveau-1", nom: "RDC" }), piece));
  const etatA = remplacerNiveau(initial, remplacerPiece(initial.niveaux[0], { ...piece, nom: "Séjour" }));
  const etatB = remplacerNiveau(initial, remplacerPiece(initial.niveaux[0], { ...piece, hauteurMm: 2700 }));
  const fileA = empiler(fileVide(), diffBatiment(initial, etatA), () => 1);
  const fileB = empiler(fileVide(), diffBatiment(initial, etatB), () => 1);
  assert.equal(fileA.length, 1);
  assert.equal(fileB.length, 1);
  assert.equal(fileA[0].objectId, "piece-1");
  assert.equal(fileB[0].objectId, "piece-1");
  assert.equal(fileA[0].baseRev, 1);
  assert.equal(fileB[0].baseRev, 1);
  assert.notDeepEqual(fileA[0].data, fileB[0].data);
  assert.equal(fileA[0].data.nom, "Séjour");
  assert.equal(fileA[0].data.hauteurMm, 2500);
  assert.equal(fileB[0].data.nom, "Salon");
  assert.equal(fileB[0].data.hauteurMm, 2700);
  assert.equal(initial.niveaux[0].pieces[0].nom, "Salon");
});

// ---- relecture adversariale du Lot 2B : création de résultat incertain, refus et corrections en vol
import { marquerEnvoyees, retirerVersions } from "../src/sync/file-envoi.js";

test("une création déjà envoyée (réponse peut-être perdue) n'est plus annulée par une suppression : les deux partent", () => {
  const creation = { objectId: "p1", kind: "piece", parentId: "n1", data: { nom: "Salon" }, deleted: false };
  const suppression = { objectId: "p1", kind: "piece", parentId: "n1", data: null, deleted: true };
  let file = empiler([], [creation], () => 0);
  file = marquerEnvoyees(file, file);
  assert.equal(file[0].envoye, true);
  file = empiler(file, [suppression], () => 0);
  assert.equal(file.length, 1);
  assert.equal(file[0].deleted, true);
  assert.equal(file[0].baseRev, 0);
  assert.equal(file[0].version, 2);
  assert.equal(file[0].envoye, true, "le drapeau « envoyé » survit au regroupement");
  // Jamais envoyée : annulation comme avant.
  assert.deepEqual(empiler(empiler([], [creation], () => 0), [suppression], () => 0), []);
});

test("marquerEnvoyees ne marque que la version envoyée ; retirerVersions ne retire que la version refusée", () => {
  const a = { objectId: "a", kind: "piece", parentId: "n", data: { nom: "A" }, deleted: false, baseRev: 1, version: 1 };
  const b = { objectId: "b", kind: "piece", parentId: "n", data: { nom: "B" }, deleted: false, baseRev: 1, version: 3 };
  const marquee = marquerEnvoyees([a, b], [{ ...a }]);
  assert.equal(marquee[0].envoye, true);
  assert.equal(marquee[1].envoye, undefined);
  const corrigee = { ...a, version: 2, data: { nom: "A corrigé" } };
  assert.deepEqual(retirerVersions([corrigee, b], [a]), [corrigee, b], "la version corrigée en vol reste");
  assert.deepEqual(retirerVersions([a, b], [a]), [b]);
});

test("réponse tardive d'un autre onglet : une version déjà acquittée ne retire pas la modification suivante (versions non réutilisables)", () => {
  let compteur = 100;
  const prochaine = () => (compteur += 1);
  const v1 = { objectId: "p1", kind: "piece", parentId: "n1", data: { nom: "V1" }, deleted: false };
  const v2 = { ...v1, data: { nom: "V2" } };
  let file = empiler([], [v1], () => 1, prochaine);
  const envoyee = file[0];
  file = acquitter(file, [envoyee], [{ object_id: "p1", rev: 2 }]); // première réponse : la file est vide
  assert.deepEqual(file, []);
  file = empiler(file, [v2], () => 2, prochaine); // l'utilisateur modifie à nouveau : nouvelle entrée, nouvelle version
  assert.notEqual(file[0].version, envoyee.version, "la version d'une nouvelle entrée ne reprend jamais un ancien numéro");
  file = acquitter(file, [envoyee], [{ object_id: "p1", rev: 2 }]); // seconde réponse, tardive, pour la même V1
  assert.equal(file.length, 1, "la modification V2 n'est pas retirée");
  assert.equal(file[0].data.nom, "V2");
});

import test from "node:test";
import assert from "node:assert/strict";
import { placementPhoto, preparerPhoto, ajouterPhotoNiveau, marquerPhotoSupprimee, cibleCommentaire, enregistrerCommentaire, deplacerRepere } from "../src/features/terrain/logique.js";
import { creerPieceRectangulaire } from "../src/domain/modele.js";
import { supprimerCible, commentairesConcernes, insererSommetTerrain, positionCommentaire, evaluerCotesLaser } from "../src/domain/terrain.js";
import { analyserLongueur, texteDepuisMm } from "../src/domain/unites.js";
import { creerHistorique, valider, annuler, retablir } from "../src/domain/historique.js";
import { reducteur } from "../src/features/releve/useReleve.js";

const piece = creerPieceRectangulaire({ id: "salon", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
const niveau = () => ({ id: "n1", pieces: [structuredClone(piece)], photos: [], commentaires: [] });

test("placement au centre de la pièce, du niveau et niveau vide", () => {
  assert.deepEqual(placementPhoto(niveau(), "salon"), { xMm: 2000, yMm: 1500, pieceId: "salon" });
  assert.deepEqual(placementPhoto(niveau()), { xMm: 2000, yMm: 1500 });
  assert.deepEqual(placementPhoto({ pieces: [] }), { xMm: 0, yMm: 0 });
});

const options = { compresser: async () => ({ blob: new Blob(["photo"], { type: "image/jpeg" }), largeurPx: 32, hauteurPx: 24 }), empreinte: async () => "a".repeat(64), uuid: () => "photo-1" };
test("ajout : compression, empreinte, fichier durable puis validation du niveau", async () => {
  const ordre = [];
  let stockage;
  const photo = await preparerPhoto({ sauverMedia: async m => { stockage = m; ordre.push("fichier"); } }, "projet", {}, placementPhoto(niveau(), "salon"), options);
  const apres = ajouterPhotoNiveau(niveau(), photo); ordre.push("objet");
  assert.deepEqual(ordre, ["fichier", "objet"]);
  assert.equal(stockage.etat, "a-envoyer"); assert.equal(stockage.projectId, "projet");
  assert.equal(apres.photos[0].tailleOctets, 5); assert.equal(apres.photos[0].pieceId, "salon");
  assert.equal(niveau().photos.length, 0);
});
for (const panne of ["compression", "empreinte", "stockage"]) test(`échec ${panne} : aucun objet photo créé`, async () => {
  let objet = false;
  const opts = { ...options };
  const refuser = async () => { throw new Error(panne); };
  if (panne === "compression") opts.compresser = refuser;
  if (panne === "empreinte") opts.empreinte = refuser;
  await assert.rejects(async () => {
    await preparerPhoto({ sauverMedia: panne === "stockage" ? refuser : async () => {} }, "p", {}, {}, opts);
    objet = true;
  }, new RegExp(panne));
  assert.equal(objet, false);
});

test("suppression fichier : intention durable même sans blob local", async () => {
  let intention;
  await marquerPhotoSupprimee({ lireMedia: async () => undefined, sauverMedia: async m => { intention = m; } }, "p", "photo");
  assert.deepEqual(intention, { id: "photo", projectId: "p", etat: "a-envoyer", supprimer: true, erreur: null });
});

test("commentaires : pièce, mur au milieu, photo et point, 500 caractères", () => {
  const n = niveau();
  assert.deepEqual(cibleCommentaire(n, piece, null, "mur:0"), { type: "mur", pieceId: "salon", murIndex: 0, positionMm: 2000 });
  assert.equal(cibleCommentaire(n, piece, null, "piece").type, "piece");
  assert.deepEqual(cibleCommentaire(n, piece, { id: "p" }, "photo"), { type: "photo", photoId: "p" });
  assert.equal(cibleCommentaire(n, null, null, "point").xMm, 2000);
  assert.throws(() => enregistrerCommentaire(n, { texte: " " }));
  assert.throws(() => enregistrerCommentaire(n, { texte: "a".repeat(501) }));
  const ajout = enregistrerCommentaire(n, { id: "c", texte: "a".repeat(500), cible: { type: "point", xMm: 0, yMm: 0 } });
  assert.equal(enregistrerCommentaire(ajout, { ...ajout.commentaires[0], texte: "Modifié" }).commentaires.length, 1);
});

for (const type of ["photo", "piece", "sommet"]) test(`choix suppression/détachement ${type}, historique réversible`, () => {
  const n = niveau(); n.photos = [{ id: "p", xMm: 100, yMm: 200 }];
  const cible = type === "photo" ? { type, photoId: "p" } : { type, pieceId: "salon", sommetIndex: 0 };
  n.commentaires = [{ id: "c", texte: "Fissure", cible: type === "photo" ? { type, photoId: "p" } : { type: "mur", pieceId: "salon", murIndex: 0, positionMm: 1000 } }];
  assert.equal(commentairesConcernes(n, cible).length, 1);
  const position = positionCommentaire(n, n.commentaires[0]);
  const detache = supprimerCible(n, cible, "detacher");
  assert.equal(detache.ok, true);
  assert.deepEqual(detache.niveau.commentaires[0].cible, { type: "point", ...position });
  assert.equal(supprimerCible(n, cible, "supprimer").niveau.commentaires.length, 0);
  const h = valider(creerHistorique(n), detache.niveau);
  assert.deepEqual(annuler(h).present, n); assert.deepEqual(retablir(annuler(h)).present, detache.niveau);
});

test("insertion : le commentaire reste au même point du mur scindé", () => {
  const n = niveau(); n.commentaires = [{ id: "c", texte: "Repère", cible: { type: "mur", pieceId: "salon", murIndex: 0, positionMm: 3000 } }];
  const r = insererSommetTerrain(n, "salon", 0);
  assert.deepEqual(positionCommentaire(r.niveau, r.niveau.commentaires[0]), positionCommentaire(n, n.commentaires[0]));
});

test("glissement : arrondi mm, photo et commentaire point seuls déplaçables", () => {
  const n = niveau(); n.photos = [{ id: "p", xMm: 0, yMm: 0 }];
  n.commentaires = [{ id: "c", texte: "Mur", cible: { type: "mur", pieceId: "salon", murIndex: 0, positionMm: 2000 } }];
  const suivant = deplacerRepere(n, "photo", "p", { xMm: 12.3, yMm: 15.8 });
  assert.equal(suivant.photos[0].yMm, 16); assert.equal(n.photos[0].yMm, 0);
  assert.deepEqual(deplacerRepere(n, "commentaire", "c", { xMm: 5, yMm: 7 }).commentaires, n.commentaires);
});

test("laser : saisie mètres/mm, seuil 20 mm et contrôle hauteur/diagonale", () => {
  assert.equal(analyserLongueur("4,021").mm, 4021); assert.equal(texteDepuisMm(4021), "4,021");
  assert.equal(analyserLongueur("invalide").ok, false);
  const p = { ...piece, cotesLaser: { longueur: { murIndex: 0, valeurMm: 4020 }, largeur: { murIndex: 1, valeurMm: 3021 }, controle: { type: "hauteur", valeurMm: 2500 } } };
  assert.deepEqual(evaluerCotesLaser(p).map(c => c.etat), ["ok", "hors-tolerance", "ok"]);
  p.cotesLaser.controle = { type: "diagonale", deSommet: 0, aSommet: 2, valeurMm: 5000 };
  assert.equal(evaluerCotesLaser(p).find(c => c.nom === "controle").ecartMm, 0);
});

test("useReleve : ajout tardif sur le niveau capturé, état récent et annuler/rétablir", () => {
  const n = niveau();
  const batiment = { id: "b", niveaux: [n, { id: "n2", pieces: [] }] };
  const etat = { historique: creerHistorique(batiment), niveauId: "n2", pieceId: null, apercu: null };
  const avecCommentaire = reducteur(etat, { type: "valider-niveau", niveauId: "n1", niveau: courant => enregistrerCommentaire(courant, { id: "c", texte: "Avant compression", cible: { type: "point", xMm: 0, yMm: 0 } }) });
  const avecPhoto = reducteur(avecCommentaire, { type: "valider-niveau", niveauId: "n1", niveau: courant => ajouterPhotoNiveau(courant, { id: "photo" }) });
  assert.equal(avecPhoto.historique.present.niveaux[0].commentaires.length, 1);
  assert.equal(avecPhoto.historique.present.niveaux[0].photos.length, 1);
  assert.equal(avecPhoto.historique.present.niveaux[1].photos, undefined);
  const annule = reducteur(avecPhoto, { type: "annuler" });
  assert.equal(annule.historique.present.niveaux[0].photos.length, 0);
  assert.deepEqual(reducteur(annule, { type: "retablir" }).historique.present, avecPhoto.historique.present);
});

test("useReleve : suppression pièce sélectionne la suivante, niveau absent ignoré", () => {
  const n = niveau(); n.pieces.push({ ...piece, id: "autre" });
  const etat = { historique: creerHistorique({ id: "b", niveaux: [n] }), niveauId: "n1", pieceId: "salon", apercu: null };
  const r = reducteur(etat, { type: "valider-niveau", niveauId: "n1", niveau: supprimerCible(n, { type: "piece", pieceId: "salon" }, "supprimer").niveau });
  assert.equal(r.pieceId, "autre");
  assert.equal(reducteur(etat, { type: "valider-niveau", niveauId: "absent", niveau: {} }), etat);
});

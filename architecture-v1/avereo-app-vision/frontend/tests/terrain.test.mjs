import test from "node:test";
import assert from "node:assert/strict";
import Dexie from "dexie";
import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import { creerPieceRectangulaire, creerNiveau, creerBatiment, translaterPiece } from "../src/domain/modele.js";
import { evaluerCotesLaser, positionCommentaire, supprimerCible, commentairesConcernes, validerCommentaire, insererSommetTerrain } from "../src/domain/terrain.js";
import { aplatirBatiment } from "../src/sync/objets.js";
import { assemblerBatiment } from "../src/sync/assembler.js";
import { diffBatiment } from "../src/sync/diff.js";
import { dimensionsImage, QUALITES_JPEG, empreinteSha256 } from "../src/sync/images.js";
import { creerMedias } from "../src/sync/medias.js";
import { creerMoteur } from "../src/sync/moteur.js";
import { creerStockageMemoire } from "../src/sync/stockage-memoire.js";
import { creerStockageDexie } from "../src/sync/stockage-dexie.js";
import { creerFauxServeur } from "./aides/faux-serveur.mjs";
import { ErreurApi, creerClient } from "../src/services/api.js";

const piece = () => creerPieceRectangulaire({ id: "salon", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
const id = "12345678-1234-4234-8234-123456789012";
const project = "a".repeat(32);
const photo = { id, xMm: 100, yMm: 200, prisLe: "2026-11-26T12:00:00Z", largeurPx: 100, hauteurPx: 200, tailleOctets: 3, sha256: "a".repeat(64), mime: "image/jpeg" };
test("laser : 4012/4020/4025 mm, diagonale 5000, hauteur 2500 ; libellés et icônes", () => {
  for (const [valeurMm, ecart, etat] of [[4012,12,"ok"],[4020,20,"ok"],[4025,25,"hors-tolerance"]]) {
    const result = evaluerCotesLaser({ ...piece(), cotesLaser: { longueur: { murIndex: 0, valeurMm }, largeur: { murIndex: 1, valeurMm: 3000 }, controle: { type: "diagonale", deSommet: 0, aSommet: 2, valeurMm: 5000 } } });
    assert.equal(result[0].ecartMm, ecart); assert.equal(result[0].etat, etat);
    assert.ok(result[0].icone && result[0].libelle);
    assert.equal(result[2].modeleMm, 5000); assert.equal(result[2].etat, "ok");
  }
  assert.equal(evaluerCotesLaser({ ...piece(), cotesLaser: { controle: { type: "hauteur", valeurMm: 2525 } } })[0].ecartMm, 25);
  assert.deepEqual(evaluerCotesLaser(piece()), []);
});

test("commentaires : coordonnées des quatre cibles, suivi du mur, texte borné", () => {
  const n = { pieces: [piece()], photos: [photo] };
  const c = { id: "c", texte: "Mur", cible: { type: "mur", pieceId: "salon", murIndex: 0, positionMm: 1000 } };
  assert.deepEqual(positionCommentaire(n, c), { xMm: 1000, yMm: 0 });
  assert.deepEqual(positionCommentaire({ ...n, pieces: [translaterPiece(piece(), 50, 100)] }, c), { xMm: 1050, yMm: 100 });
  assert.deepEqual(positionCommentaire(n, { cible: { type: "piece", pieceId: "salon" } }), { xMm: 2000, yMm: 1500 });
  assert.deepEqual(positionCommentaire(n, { cible: { type: "photo", photoId: id } }), { xMm: 100, yMm: 200 });
  assert.equal(positionCommentaire(n, { cible: { type: "photo", photoId: "absent" } }), null);
  for (const texte of ["", " ", "a".repeat(501)]) assert.equal(validerCommentaire({ texte }), false);
  assert.equal(validerCommentaire({ texte: "é".repeat(500) }), true);
});

test("suppression : liste, détachement à dernière position, suppression, renumérotation", () => {
  const commentaires = [0,1,2,3].map(murIndex => ({ id: `c${murIndex}`, texte: "x", cible: { type: "mur", pieceId: "salon", murIndex, positionMm: 500 } }));
  const n = { pieces: [piece()], photos: [photo], commentaires };
  const cible = { type: "sommet", pieceId: "salon", sommetIndex: 1 };
  assert.equal(commentairesConcernes(n, cible).length, 2);
  const detached = supprimerCible(n, cible, "detacher").niveau;
  assert.deepEqual(detached.commentaires[1].cible, { type: "point", xMm: 4000, yMm: 500 });
  assert.equal(detached.commentaires[2].cible.murIndex, 1);
  assert.equal(supprimerCible(n, cible, "supprimer").niveau.commentaires.length, 2);
  assert.equal(supprimerCible(n, { type: "piece", pieceId: "salon" }, "supprimer").niveau.commentaires.length, 0);
  const np = { ...n, commentaires: [{ id: "cp", texte: "x", cible: { type: "photo", photoId: id } }] };
  assert.deepEqual(supprimerCible(np, { type: "photo", photoId: id }, "detacher").niveau.commentaires[0].cible, { type: "point", xMm: 100, yMm: 200 });
  assert.equal(n.pieces[0].sommets.length, 4);
});

test("sync : round trip terrain, diff suppression enfants, ancien relevé", () => {
  const b = creerBatiment({ niveaux: [creerNiveau({ pieces: [{ ...piece(), cotesLaser: { longueur: { murIndex: 0, valeurMm: 4012 } } }], photos: [photo], commentaires: [{ id: "c", texte: "x", cible: { type: "photo", photoId: id } }] })] });
  assert.deepEqual(assemblerBatiment(aplatirBatiment(b)).batiment, b);
  const changes = diffBatiment(b, { ...b, niveaux: [] });
  assert.ok(changes.findIndex(c => c.kind === "photo") < changes.findIndex(c => c.kind === "niveau"));
  assert.equal(assemblerBatiment(aplatirBatiment(creerBatiment({ niveaux: [creerNiveau()] }))).orphelins.length, 0);
});

test("insertion : commentaires et cotes laser gardent leurs repères valides", () => {
  const p = { ...piece(), cotesLaser: { longueur: { murIndex: 0, valeurMm: 4012 }, largeur: { murIndex: 1, valeurMm: 3000 }, controle: { type: "diagonale", deSommet: 0, aSommet: 2, valeurMm: 5000 } } };
  const n = { pieces: [p], commentaires: [{ id: "c", texte: "x", cible: { type: "mur", pieceId: "salon", murIndex: 0, positionMm: 3000 } }] };
  const result = insererSommetTerrain(n, "salon", 0).niveau;
  assert.deepEqual(result.commentaires[0].cible, { type: "mur", pieceId: "salon", murIndex: 1, positionMm: 1000 });
  assert.equal(result.pieces[0].cotesLaser.longueur, undefined);
  assert.equal(result.pieces[0].cotesLaser.largeur.murIndex, 2);
  assert.equal(evaluerCotesLaser(result.pieces[0])[1].etat, "ok");
  assert.throws(() => evaluerCotesLaser({ ...piece(), cotesLaser: { longueur: { murIndex: 7, valeurMm: 10 } } }));
});

test("images : dimensions, paliers, SHA256 connu", async () => {
  assert.deepEqual(dimensionsImage(4000, 3000), { largeur: 2560, hauteur: 1920 });
  assert.deepEqual(dimensionsImage(3000, 4000), { largeur: 1920, hauteur: 2560 });
  assert.deepEqual(dimensionsImage(100, 200), { largeur: 100, hauteur: 200 });
  assert.throws(() => dimensionsImage(0, 0));
  assert.ok(QUALITES_JPEG.every((q, i) => q > 0 && (i === 0 || q < QUALITES_JPEG[i-1])));
  assert.equal(await empreinteSha256(new Blob(["abc"])), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

for (const [nom, creer] of Object.entries({ memoire: creerStockageMemoire, dexie: () => creerStockageDexie({ nom: `media-${crypto.randomUUID()}`, indexedDB, IDBKeyRange }) })) {
  test(`medias ${nom} : blobs, isolation projets et copie`, async () => {
    const s = creer();
    await s.sauverMedia({ id, projectId: project, etat: "a-envoyer", blob: new Blob(["abc"]) });
    assert.equal(await (await s.lireMedia(project, id)).blob.text(), "abc");
    assert.equal(await s.lireMedia("autre", id), undefined);
    assert.equal((await s.listerMedias(project)).length, 1);
    await s.retirerMedia(project, id);
    assert.equal((await s.listerMedias(project)).length, 0);
    await s.supprimer?.();
  });
}

test("Dexie v1 vers v2 : relevé et file préservés", async () => {
  const nom = `upgrade-${crypto.randomUUID()}`;
  const old = new Dexie(nom, { indexedDB, IDBKeyRange });
  old.version(1).stores({ meta: "cle", projets: "id", operations: "cle", objets: "[projectId+id], projectId", files: "projectId", suivis: "projectId", journal: "[projectId+id], projectId" });
  await old.table("files").put({ projectId: project, entrees: [{ objectId: "ancien" }] });
  await old.table("objets").put({ projectId: project, id: "ancien", rev: 2 }); old.close();
  const s = creerStockageDexie({ nom, indexedDB, IDBKeyRange });
  const p = await s.chargerProjet(project);
  assert.equal(p.file[0].objectId, "ancien"); assert.equal(p.objets[0].rev, 2);
  assert.deepEqual(await s.listerMedias(project), []); await s.supprimer();
});

async function scenario() {
  const serveur = creerFauxServeur();
  await serveur.api.creerProjet({ id: project, name: "Test" });
  const stockage = creerStockageMemoire();
  const moteur = creerMoteur({ stockage, api: serveur.api, deviceId: "telephone-test", delaiOuvertureMs: 0 });
  const service = creerMedias(moteur, project, "niveau-1", { uuid: () => id, compresser: async () => ({ blob: new Blob(["abc"], { type: "image/jpeg" }), largeurPx: 100, hauteurPx: 200 }) });
  return { serveur, stockage, moteur, service };
}

test("medias : hors ligne visible, PUT après objet acquitté, reprise, suppression", async () => {
  const { serveur, moteur, service } = await scenario();
  serveur.etat.horsLigne = true;
  await service.ajouterPhoto(new Blob(), { xMm: 100, yMm: 200 });
  assert.match(await service.urlPhoto(id), /^blob:/);
  assert.equal(await moteur.synchroniserProjet(project), false);
  let puts = 0, deletes = 0;
  serveur.api.envoyerMedia = async () => { puts++; assert.equal(serveur.projets.get(project).objets.get(id).kind, "photo"); };
  serveur.api.supprimerMedia = async () => { deletes++; };
  serveur.etat.horsLigne = false;
  await moteur.synchroniserProjet(project); await moteur.synchroniserProjet(project);
  assert.equal(puts, 1); assert.equal((await moteur.lireMedia(project, id)).etat, "envoye");
  await service.supprimerPhoto(id); await moteur.synchroniserProjet(project);
  assert.equal(deletes, 1); assert.equal(await moteur.lireMedia(project, id), undefined); service.fermer();
});

for (const [statut, reseau, retry] of [[401,"reconnexion",true],[409,"ok",false],[413,"ok",false],[0,"hors-ligne",true],[500,"erreur",true]]) {
  test(`medias : erreur ${statut}, état et absence de boucle 4xx`, async () => {
    const { serveur, moteur, service } = await scenario();
    await service.ajouterPhoto(new Blob(), { xMm: 1, yMm: 2 });
    let appels = 0;
    serveur.api.envoyerMedia = async () => { appels++; throw new ErreurApi(statut, "test", "Refus"); };
    await moteur.synchroniserProjet(project);
    assert.equal(moteur.etat().reseau, reseau);
    await moteur.synchroniserProjet(project);
    assert.equal(appels, retry ? 2 : 1); service.fermer();
  });
}

test("client médias : corps brut, identité attendue, blob en lecture", async () => {
  const appels = [];
  const client = creerClient({ fetchImpl: async (url, opts) => { appels.push([url, opts]); return new Response(opts.method === "GET" ? "abc" : '{"ok":true}', { status: 200 }); } }).pour({ provider: "local", id: "1" });
  const blob = new Blob(["abc"]);
  await client.envoyerMedia(project, { id, blob, mime: "image/jpeg", sha256: "a".repeat(64) });
  assert.equal(appels[0][1].body, blob);
  assert.equal(appels[0][1].headers["X-Vision-Expected-Identity"], "local:1");
  assert.equal(await (await client.telechargerMedia(project, id)).text(), "abc");
});

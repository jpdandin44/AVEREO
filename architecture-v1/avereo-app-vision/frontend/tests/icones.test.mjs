import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { ICONES, dessinerIcone, encoderPng } from "../scripts/icones-provisoires.mjs";

const FOND = [0x00, 0x2b, 0x45, 255];
const BLANC = [255, 255, 255, 255];

// Calcul par table, indépendant du calcul bit par bit de l'encodeur.
const tableCrc = Array.from({ length: 256 }, (_, indice) => {
  let crc = indice;
  for (let bit = 0; bit < 8; bit++) {
    crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(octets) {
  return (octets.reduce((crc, octet) => tableCrc[(crc ^ octet) & 255] ^ (crc >>> 8), 0xffffffff)
    ^ 0xffffffff) >>> 0;
}

function decoderPng(png) {
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const blocs = [];
  let position = 8;
  while (position < png.length) {
    assert.ok(position + 12 <= png.length, "En-tête de bloc PNG tronqué");
    const longueur = png.readUInt32BE(position);
    const fin = position + 8 + longueur;
    assert.ok(fin + 4 <= png.length, "Données de bloc PNG tronquées");
    const type = png.toString("ascii", position + 4, position + 8);
    assert.equal(png.readUInt32BE(fin), crc32(png.subarray(position + 4, fin)), `CRC ${type}`);
    blocs.push({ type, donnees: png.subarray(position + 8, fin) });
    position = fin + 4;
  }
  assert.equal(position, png.length);
  assert.deepEqual(blocs.map(({ type }) => type), ["IHDR", "IDAT", "IEND"]);
  const ihdr = blocs[0].donnees;
  assert.equal(ihdr.length, 13);
  const largeur = ihdr.readUInt32BE(0);
  const hauteur = ihdr.readUInt32BE(4);
  assert.deepEqual([...ihdr.subarray(8)], [8, 6, 0, 0, 0]);
  assert.equal(blocs[2].donnees.length, 0);
  const lignes = inflateSync(blocs[1].donnees);
  const pas = largeur * 4;
  assert.equal(lignes.length, (pas + 1) * hauteur);
  const rgba = Buffer.alloc(pas * hauteur);
  for (let y = 0; y < hauteur; y++) {
    const debut = y * (pas + 1);
    assert.equal(lignes[debut], 0, `Filtre de la ligne ${y}`);
    lignes.copy(rgba, y * pas, debut + 1, debut + 1 + pas);
  }
  return { largeur, hauteur, rgba };
}

function pixel(rgba, taille, x, y) {
  const debut = (y * taille + x) * 4;
  return [...rgba.subarray(debut, debut + 4)];
}

test("le décodeur vérifie le CRC32 avec le vecteur de référence", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
});

for (const { fichier, taille, zoneUtile } of ICONES) {
  test(`R09 : ${fichier}, PNG conforme, V symétrique et fichier reproductible`, () => {
    const image = dessinerIcone(taille, { zoneUtile });
    assert.ok(image instanceof Uint8Array);
    assert.equal(image.length, taille * taille * 4);
    const png = encoderPng(taille, taille, image);
    const { largeur, hauteur, rgba } = decoderPng(png);
    assert.equal(largeur, taille);
    assert.equal(hauteur, taille);
    assert.deepEqual(rgba, Buffer.from(image));
    assert.deepEqual(pixel(rgba, taille, 0, 0), FOND);
    assert.deepEqual(pixel(rgba, taille, taille / 2, taille / 2), FOND);
    const basDuV = Math.floor((0.5 + zoneUtile / 2 - 0.05) * taille);
    assert.deepEqual(pixel(rgba, taille, taille / 2, basDuV), BLANC);

    let pixelsAnticreneles = 0;
    for (let y = 0; y < taille; y++) {
      const ligne = rgba.subarray(y * taille * 4, (y + 1) * taille * 4);
      const miroir = Buffer.alloc(ligne.length);
      for (let x = 0; x < taille; x++) {
        ligne.copy(miroir, (taille - 1 - x) * 4, x * 4, x * 4 + 4);
        assert.equal(ligne[x * 4 + 3], 255, "Chaque pixel reste opaque");
        if (ligne[x * 4] > 0 && ligne[x * 4] < 255) pixelsAnticreneles++;
        if (fichier === "icone-maskable-512.png"
          && Math.hypot(x + 0.5 - taille / 2, y + 0.5 - taille / 2) > taille * 0.4) {
          assert.deepEqual(pixel(rgba, taille, x, y), FOND, `Hors zone sûre : ${x}, ${y}`);
        }
      }
      assert.deepEqual(ligne, miroir, `Symétrie de la ligne ${y}`);
    }
    assert.ok(pixelsAnticreneles > 0, "Les bords du V sont anticrénelés");
    assert.deepEqual(encoderPng(taille, taille, dessinerIcone(taille, { zoneUtile })), png,
      "Deux appels doivent donner exactement les mêmes octets");

    const chemin = new URL(`../public/icons/${fichier}`, import.meta.url);
    const consigne = `${fichier} : relancer node scripts/icones-provisoires.mjs dans frontend/`;
    assert.ok(existsSync(chemin), consigne);
    assert.deepEqual(readFileSync(chemin), png, consigne);
  });
}

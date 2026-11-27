// Icônes provisoires de Rapport installable (Android) : aplat bleu nuit #002B45 et « R » géométrique blanc,
// sans police ni reprise du logo (charte : le logo ne se redessine pas). À VÉRIFIER : fichier logo carré.
// Usage, depuis frontend/ : node scripts/icones-application.mjs  → public/icons/
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ICONES = [
  { fichier: 'rapport-192.png', taille: 192, zoneUtile: 0.6 },
  { fichier: 'rapport-512.png', taille: 512, zoneUtile: 0.6 },
  { fichier: 'rapport-maskable-512.png', taille: 512, zoneUtile: 0.5 },
];

const FOND = [0x00, 0x2b, 0x45];
const CENTRE_BOUCLE = { x: -0.05, y: -0.22 };

function distanceSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Le point (x, y), centré sur la zone utile de côté 1, appartient-il au « R » ? */
export function dansR(x, y) {
  if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) return false;
  const fut = x >= -0.35 && x <= -0.17;
  const barreHaute = x >= -0.17 && x <= CENTRE_BOUCLE.x && y >= -0.5 && y <= -0.33;
  const barreBasse = x >= -0.17 && x <= CENTRE_BOUCLE.x && y >= -0.11 && y <= 0.06;
  const r = Math.hypot(x - CENTRE_BOUCLE.x, y - CENTRE_BOUCLE.y);
  const boucle = x >= CENTRE_BOUCLE.x && r <= 0.28 && r >= 0.11;
  const jambe = y >= 0 && distanceSegment(x, y, -0.04, 0.02, 0.3, 0.5) <= 0.09;
  return fut || barreHaute || barreBasse || boucle || jambe;
}

/** Image RGBA opaque, suréchantillonnage 4 × 4. */
export function dessinerIcone(taille, { zoneUtile = 0.6 } = {}) {
  const rgba = new Uint8Array(taille * taille * 4);
  const coteZone = zoneUtile * taille;
  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      let blancs = 0;
      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
          if (dansR((x + (sx + 0.5) / 4 - taille / 2) / coteZone, (y + (sy + 0.5) / 4 - taille / 2) / coteZone)) blancs++;
        }
      }
      const i = (y * taille + x) * 4;
      for (let canal = 0; canal < 3; canal++) rgba[i + canal] = Math.round(FOND[canal] + (255 - FOND[canal]) * blancs / 16);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

function crc32(octets) {
  let crc = 0xffffffff;
  for (const octet of octets) {
    crc ^= octet;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function blocPng(type, donnees) {
  const contenu = Buffer.concat([Buffer.from(type, 'ascii'), donnees]);
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(contenu));
  return Buffer.concat([longueur, contenu, crc]);
}

/** PNG RGBA 8 bits : IHDR, un IDAT zlib, IEND. */
export function encoderPng(largeur, hauteur, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0);
  ihdr.writeUInt32BE(hauteur, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const pas = largeur * 4;
  const lignes = Buffer.alloc((pas + 1) * hauteur);
  for (let y = 0; y < hauteur; y++) lignes.set(rgba.subarray(y * pas, (y + 1) * pas), y * (pas + 1) + 1);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    blocPng('IHDR', ihdr),
    blocPng('IDAT', deflateSync(lignes, { level: 9 })),
    blocPng('IEND', Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dossier = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
  mkdirSync(dossier, { recursive: true });
  for (const { fichier, taille, zoneUtile } of ICONES) {
    const png = encoderPng(taille, taille, dessinerIcone(taille, { zoneUtile }));
    writeFileSync(join(dossier, fichier), png);
    console.log(`${fichier} : ${taille} × ${taille} px, ${png.length} octets`);
  }
}

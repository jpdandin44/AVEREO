import test from "node:test";
import assert from "node:assert/strict";
import { aimanter } from "../src/features/plan2d/aimantation.js";

const sommets = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 3000 },
  { x: 0, y: 3000 },
];

test("sans sommet voisin, le point est aimanté sur la grille de 10 mm", () => {
  assert.deepEqual(aimanter({ x: 1234, y: 987 }), { x: 1230, y: 990, alignX: false, alignY: false });
});

test("un point proche d'un sommet s'aligne sur lui (angle droit)", () => {
  const r = aimanter({ x: 4040, y: 1500 }, { sommets, toleranceMm: 100 });
  assert.equal(r.x, 4000);
  assert.equal(r.alignX, true);
  assert.equal(r.y, 1500);
  assert.equal(r.alignY, false);
});

test("alignement sur les deux axes : le point se cale sur le sommet", () => {
  const r = aimanter({ x: 3950, y: 3060 }, { sommets, toleranceMm: 100 });
  assert.deepEqual([r.x, r.y, r.alignX, r.alignY], [4000, 3000, true, true]);
});

test("le sommet en cours de déplacement est ignoré", () => {
  const r = aimanter({ x: 4010, y: 10 }, { sommets, ignorerIndex: 1, toleranceMm: 100 });
  // sans le sommet 1 (4000;0), x s'aligne sur le sommet 2 (4000;3000) et y sur le sommet 0 (0;0)
  assert.deepEqual([r.x, r.y], [4000, 0]);
  const r2 = aimanter({ x: 4010, y: 10 }, { sommets: [sommets[1]], ignorerIndex: 0, toleranceMm: 100 });
  assert.deepEqual([r2.x, r2.y, r2.alignX, r2.alignY], [4010, 10, false, false]);
});

test("hors tolérance, pas d'alignement", () => {
  const r = aimanter({ x: 4300, y: 1500 }, { sommets, toleranceMm: 100 });
  assert.equal(r.alignX, false);
  assert.equal(r.x, 4300);
});

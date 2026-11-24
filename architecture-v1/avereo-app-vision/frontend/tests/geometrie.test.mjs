import test from "node:test";
import assert from "node:assert/strict";
import {
  aireMm2,
  aireSigneeMm2,
  distance,
  estAutoSecant,
  longueurMurMm,
  perimetreMm,
  projeterSurSegment,
  segmentsSeTouchent,
} from "../src/domain/geometrie.js";

const rectangle = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 3000 },
  { x: 0, y: 3000 },
];

const enL = [
  { x: 0, y: 0 },
  { x: 5000, y: 0 },
  { x: 5000, y: 2000 },
  { x: 3000, y: 2000 },
  { x: 3000, y: 4000 },
  { x: 0, y: 4000 },
];

test("aire par la formule de Gauss", () => {
  assert.equal(aireMm2(rectangle), 12_000_000);
  assert.equal(aireMm2(enL), 16_000_000);
  assert.equal(aireSigneeMm2(rectangle), 12_000_000);
  assert.equal(aireSigneeMm2([...rectangle].reverse()), -12_000_000);
});

test("périmètre et longueur des murs", () => {
  assert.equal(perimetreMm(rectangle), 14_000);
  assert.equal(perimetreMm(enL), 18_000);
  assert.deepEqual(rectangle.map((_, i) => longueurMurMm(rectangle, i)), [4000, 3000, 4000, 3000]);
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test("contour qui se recoupe", () => {
  assert.equal(estAutoSecant(rectangle), false);
  assert.equal(estAutoSecant(enL), false);
  const papillon = [
    { x: 0, y: 0 },
    { x: 4000, y: 3000 },
    { x: 4000, y: 0 },
    { x: 0, y: 3000 },
  ];
  assert.equal(estAutoSecant(papillon), true);
});

test("contact entre segments : croisement, extrémité, recouvrement, parallèles", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 10, y: 0 };
  assert.equal(segmentsSeTouchent(a, b, { x: 5, y: -5 }, { x: 5, y: 5 }), true);
  assert.equal(segmentsSeTouchent(a, b, { x: 10, y: 0 }, { x: 10, y: 5 }), true);
  assert.equal(segmentsSeTouchent(a, b, { x: 5, y: 0 }, { x: 15, y: 0 }), true);
  assert.equal(segmentsSeTouchent(a, b, { x: 0, y: 5 }, { x: 10, y: 5 }), false);
  assert.equal(segmentsSeTouchent(a, b, { x: 11, y: 0 }, { x: 20, y: 0 }), false);
});

test("projection d'un point sur un segment", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 100, y: 0 };
  const milieu = projeterSurSegment({ x: 50, y: 30 }, a, b);
  assert.equal(milieu.t, 0.5);
  assert.deepEqual(milieu.point, { x: 50, y: 0 });
  assert.equal(milieu.distance, 30);
  assert.equal(projeterSurSegment({ x: -20, y: 0 }, a, b).t, 0);
  assert.equal(projeterSurSegment({ x: 500, y: 0 }, a, b).t, 1);
  assert.equal(projeterSurSegment({ x: 5, y: 5 }, a, a).t, 0);
});

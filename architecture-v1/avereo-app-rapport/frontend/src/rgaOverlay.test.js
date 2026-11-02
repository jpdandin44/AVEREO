import test from 'node:test';
import assert from 'node:assert/strict';
import { fromLambert93, mercatorPoint, decodeRgaPolygons, intersects } from './rgaOverlay.js';

test('la reprojection RGA concorde avec PROJ sur cinq points du territoire', () => {
  // Independent reference: pyproj 3.8.0, Transformer EPSG:2154 -> EPSG:4326, always_xy.
  for (const [x, y, lon, lat] of [
    [700000, 6600000, 3, 46.5],
    [648000, 6862000, 2.291299103553126, 48.85593769982062],
    [556600, 6279500, 1.2244180792633388, 43.60004362955065],
    [932000, 6463000, 5.956866798456543, 45.22723159989779],
    [1100000, 6150000, 7.8489327262763595, 42.33946006556278],
  ]) {
    const point = fromLambert93(x, y);
    assert.ok(Math.abs(point[0] - lon) < 1e-8);
    assert.ok(Math.abs(point[1] - lat) < 1e-8);
  }
  assert.equal(fromLambert93(NaN, 6600000), null);
  assert.deepEqual(mercatorPoint(0, 0), [.5, .5]);
});

test('le décodage des deltas conserve les trous et la position des contours', () => {
  const source = [[2, 1, [[70000, 660000, 10, 0, 0, 10, -10, 0], [70002, 660002, 2, 0, 0, 2, -2, 0]]]];
  const before = JSON.stringify(source);
  const [polygon] = decodeRgaPolygons(source, 10);
  assert.equal(polygon.level, 2);
  assert.equal(polygon.rings.length, 2);
  mercatorPoint(3, 46.5).forEach((value, index) => assert.ok(Math.abs(polygon.rings[0][index] - value) < 1e-12));
  const centre = mercatorPoint(...fromLambert93(700050, 6600050));
  assert.equal(intersects(polygon.bbox, [...centre, ...centre]), true);
  assert.equal(intersects(polygon.bbox, [0, 0, .1, .1]), false);
  assert.equal(JSON.stringify(source), before);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { FULL_PHOTO, cropFromSelection, photoHistoryChange, photoHistoryUndo, photoHistoryRedo, applyPhotoReportVersion, photoReportVersion, reportPhotoSource, validPhotoOperations, paintPhotoVersion } from './photoReportVersion.js';
import { photoBlob } from './photoOriginals.js';

const photo = () => ({ id: 'p1', src: 'data:image/png;base64,b3JpZ2luYWw=', name: 'original.png', unknown: 'keep' });
const version = () => ({ version: 1, sourcePhotoId: 'p1', sourceSha256: 'a'.repeat(64), src: 'data:image/jpeg;base64,cHJlcGFyZWQ=', operations: { crop: { x: .1, y: .1, width: .8, height: .8 }, annotations: [{ type: 'text', x: .2, y: .3, text: 'Détail à vérifier' }] } });
const report = () => ({ observations: [{ id: 'o1', photos: [photo()] }] });
const target = () => ({ observationId: 'o1', photoId: 'p1', src: photo().src });

test('preparing/selecting a report copy never overwrites the original or its private reference', async () => {
  const r = report(); r.observations[0].photos[0].original = { id: 'private-original', sha256: 'b'.repeat(64) };
  const before = JSON.stringify(r), edited = applyPhotoReportVersion(r, target(), version());
  const p = edited.observations[0].photos[0];
  assert.equal(JSON.stringify(r), before); assert.equal(p.src, photo().src); assert.equal(p.unknown, 'keep');
  assert.deepEqual(p.original, r.observations[0].photos[0].original);
  assert.equal(reportPhotoSource(p), version().src);
  assert.equal(await photoBlob(p).text(), 'original');
  const restored = applyPhotoReportVersion(edited, target(), version(), 'original').observations[0].photos[0];
  assert.equal(reportPhotoSource(restored), photo().src); assert.deepEqual(restored.reportVersion, version());
});
test('JSON reopen preserves original, report image, operations and explicit choice', () => {
  const edited = applyPhotoReportVersion(report(), target(), version());
  const reopened = JSON.parse(JSON.stringify(edited));
  assert.equal(reportPhotoSource(reopened.observations[0].photos[0]), version().src);
  assert.deepEqual(reopened.observations[0].photos[0].reportVersion.operations, version().operations);
  assert.equal(reopened.observations[0].photos[0].src, photo().src);
});
test('old photos and malformed or foreign prepared images fall back to the original without mutating data', () => {
  for (const malformed of [{ ...version(), sourcePhotoId: 'another' }, { ...version(), version: 5 }, { ...version(), src: 'https://example.org/private' }, { ...version(), operations: { crop: FULL_PHOTO, annotations: [{ type: 'script', x: 0, y: 0 }] } }]) {
    const p = { ...photo(), reportPhotoChoice: 'prepared', reportVersion: malformed }, before = JSON.stringify(p);
    assert.equal(photoReportVersion(p), null); assert.equal(reportPhotoSource(p), p.src); assert.equal(JSON.stringify(p), before);
  }
  assert.equal(reportPhotoSource(photo()), photo().src);
  assert.equal(reportPhotoSource({ ...photo(), reportVersion: version() }), photo().src);
});
test('late prepared results cannot attach to a replaced photo, removed finding or different online report', () => {
  for (const r of [report(), { observations: [] }, { ...report(), onlineReportId: 'different' }]) {
    if (r.observations.length && !r.onlineReportId) r.observations[0].photos[0].src += 'changed';
    assert.equal(applyPhotoReportVersion(r, target(), version()), r);
  }
});
test('ambiguous imported finding or photo identifiers are never modified', () => {
  const duplicatedFinding = report(); duplicatedFinding.observations.push(structuredClone(duplicatedFinding.observations[0]));
  assert.equal(applyPhotoReportVersion(duplicatedFinding, target(), version()), duplicatedFinding);
  const duplicatedPhoto = report(); duplicatedPhoto.observations[0].photos.push(photo());
  assert.equal(applyPhotoReportVersion(duplicatedPhoto, target(), version()), duplicatedPhoto);
});
test('undo and redo restore crop and annotations, while a new modification clears the redo branch', () => {
  const start = { past: [], present: { crop: { ...FULL_PHOTO }, annotations: [] }, future: [] };
  const edited = photoHistoryChange(start, version().operations);
  assert.deepEqual(photoHistoryUndo(edited).present, start.present);
  assert.deepEqual(photoHistoryRedo(photoHistoryUndo(edited)).present, version().operations);
  assert.equal(photoHistoryChange(photoHistoryUndo(edited), { crop: FULL_PHOTO, annotations: [{ type: 'rectangle', x: .1, y: .2, x2: .5, y2: .6 }] }).future.length, 0);
  assert.deepEqual(start.present.crop, FULL_PHOTO);
});
test('successive crop selections stay relative to the complete original and tiny selections leave it unchanged', () => {
  const crop = cropFromSelection(FULL_PHOTO, { x: .1, y: .2 }, { x: .9, y: .8 });
  const again = cropFromSelection(crop, { x: .5, y: 0 }, { x: 1, y: .5 });
  assert.equal(again.x, .5); assert.equal(again.y, .2); assert.equal(again.width, .4);
  assert.ok(Math.abs(again.height - .3) < 1e-9);
  assert.equal(cropFromSelection(crop, { x: .2, y: .2 }, { x: .201, y: .201 }), crop);
});
test('invalid coordinates, unbounded text and too many annotations cannot be applied', () => {
  for (const operations of [{ crop: { ...FULL_PHOTO, x: NaN }, annotations: [] }, { crop: { ...FULL_PHOTO, x: .5 }, annotations: [] }, { crop: FULL_PHOTO, annotations: [{ type: 'text', x: .5, y: .5, text: 'x'.repeat(201) }] }, { crop: FULL_PHOTO, annotations: Array(31).fill({ type: 'arrow', x: 0, y: 0, x2: 1, y2: 1 }) }]) {
    assert.ok(!validPhotoOperations(operations));
    const r = report(); assert.equal(applyPhotoReportVersion(r, target(), { ...version(), operations }), r);
  }
});

test('a crop hides comments outside its original coordinates and restoring the full frame reveals them', () => {
  const painted = [];
  const context = { fillRect() {}, drawImage() {}, measureText: text => ({ width: text.length * 8 }), fillText: text => painted.push(text) };
  const canvas = { getContext: () => context }, image = { naturalWidth: 1200, naturalHeight: 800 };
  const operations = { crop: { x: .5, y: .5, width: .5, height: .5 }, annotations: [{ type: 'text', x: .1, y: .1, text: 'Conservé hors cadrage' }] };
  paintPhotoVersion(canvas, image, operations);
  assert.deepEqual(painted, []);
  paintPhotoVersion(canvas, image, { ...operations, crop: FULL_PHOTO });
  assert.deepEqual(painted, ['Conservé hors cadrage']);
  assert.equal(operations.annotations[0].x, .1);
});

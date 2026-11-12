import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendPhotos, importPhotoFiles, isWorthKeeping, prepareImportedPhoto,
  shouldCompress, summarizeImport, targetDimensions,
} from './photoCompression.js';

const MIO = 1024 * 1024;
const file = (name, size, type = 'image/jpeg') => ({ name, size, type });
const blob = (size) => ({ size, optimized: true });
// L'« encodage » rend un blob de taille choisie ; la lecture dit d'où vient le contenu.
const deps = (optimizedSize, extra = {}) => {
  let counter = 0;
  return {
    render: async () => blob(optimizedSize),
    readDataUrl: async (source) => `data:image/jpeg;base64,${source.optimized ? 'OPT' : 'ORIG'}-${source.name || 'blob'}`,
    createId: () => `id-${++counter}`,
    now: () => '2026-11-12T10:00:00.000Z',
    ...extra,
  };
};

test('seules les images JPEG, PNG et WebP de plus de 1,5 Mio sont candidates', () => {
  assert.equal(shouldCompress(file('a.jpg', 1.5 * MIO)), false);
  assert.equal(shouldCompress(file('a.jpg', 1.5 * MIO + 1)), true);
  assert.equal(shouldCompress(file('a.png', 5 * MIO, 'image/png')), true);
  assert.equal(shouldCompress(file('a.webp', 5 * MIO, 'image/webp')), true);
  assert.equal(shouldCompress(file('a.gif', 5 * MIO, 'image/gif')), false);
  assert.equal(shouldCompress(file('a.svg', 5 * MIO, 'image/svg+xml')), false);
  assert.equal(shouldCompress(file('a.heic', 5 * MIO, 'image/heic')), false);
  assert.equal(shouldCompress(file('inconnu', 5 * MIO, '')), false);
  assert.equal(shouldCompress(file('petit.jpg', 200 * 1024)), false);
});

test('les dimensions sont réduites à 2400 px sans déformation ni agrandissement', () => {
  assert.deepEqual(targetDimensions(4000, 3000), { width: 2400, height: 1800 });
  assert.deepEqual(targetDimensions(3000, 4000), { width: 1800, height: 2400 });
  assert.deepEqual(targetDimensions(2400, 1200), { width: 2400, height: 1200 });
  assert.deepEqual(targetDimensions(1000, 800), { width: 1000, height: 800 });
  assert.deepEqual(targetDimensions(24000, 1), { width: 2400, height: 1 });
  assert.throws(() => targetDimensions(0, 100));
  assert.throws(() => targetDimensions(Number.NaN, 100));
});

test('la version optimisée n’est retenue qu’à partir de 15 % de gain', () => {
  assert.equal(isWorthKeeping(100, 85), true);
  assert.equal(isWorthKeeping(100, 86), false);
  assert.equal(isWorthKeeping(100, 120), false);
  assert.equal(isWorthKeeping(100, 0), false);
});

test('une grande photo optimisée garde identifiant, nom et horodatage et change de contenu', async () => {
  const item = await prepareImportedPhoto(file('facade.png', 6 * MIO, 'image/png'), deps(1 * MIO));
  assert.deepEqual(item.photo, {
    id: 'id-1', name: 'facade.png', src: 'data:image/jpeg;base64,OPT-blob', horodatageISO: '2026-11-12T10:00:00.000Z',
  });
  assert.equal(item.savedBytes, 5 * MIO);
  assert.equal(item.optimizationFailed, false);
});

test('un gain insuffisant conserve le fichier original tel quel', async () => {
  const original = file('mur.jpg', 2 * MIO);
  const item = await prepareImportedPhoto(original, deps(1.9 * MIO));
  assert.equal(item.photo.src, 'data:image/jpeg;base64,ORIG-mur.jpg');
  assert.equal(item.savedBytes, 0);
  assert.equal(item.optimizationFailed, false);
});

test('une photo légère n’est jamais décodée ni ré-encodée', async () => {
  let renders = 0;
  const item = await prepareImportedPhoto(file('petit.jpg', 300 * 1024), deps(1, { render: async () => { renders += 1; return blob(1); } }));
  assert.equal(renders, 0);
  assert.equal(item.photo.src, 'data:image/jpeg;base64,ORIG-petit.jpg');
});

test('une image non décodable est conservée et signalée, sans perdre les autres', async () => {
  const render = async (candidate) => {
    if (candidate.name === 'cassee.jpg') throw new Error('décodage impossible');
    return blob(MIO);
  };
  const result = await importPhotoFiles(
    [file('a.jpg', 5 * MIO), file('cassee.jpg', 5 * MIO), file('b.jpg', 5 * MIO)],
    deps(MIO, { render }),
  );
  assert.deepEqual(result.photos.map((photo) => photo.name), ['a.jpg', 'cassee.jpg', 'b.jpg']);
  assert.equal(result.photos[1].src, 'data:image/jpeg;base64,ORIG-cassee.jpg');
  assert.equal(result.optimizedCount, 2);
  assert.equal(result.savedBytes, 8 * MIO);
  assert.deepEqual(result.unoptimizedNames, ['cassee.jpg']);
  assert.deepEqual(result.unreadableNames, []);
});

test('un fichier totalement illisible est refusé seul et nommé', async () => {
  const readDataUrl = async (source) => {
    if (source.name === 'vide.jpg') throw new Error('lecture');
    return 'data:image/jpeg;base64,OK';
  };
  const result = await importPhotoFiles(
    [file('vide.jpg', 100), file('bon.jpg', 100)],
    deps(1, { readDataUrl }),
  );
  assert.deepEqual(result.photos.map((photo) => photo.name), ['bon.jpg']);
  assert.deepEqual(result.unreadableNames, ['vide.jpg']);
});

test('le résumé indique le gain, les photos inchangées et les erreurs', () => {
  const base = { photos: [], optimizedCount: 0, savedBytes: 0, unreadableNames: [], unoptimizedNames: [] };
  assert.deepEqual(summarizeImport({ ...base, photos: [{}, {}, {}], optimizedCount: 2, savedBytes: 7.25 * MIO }),
    { message: '3 photos ajoutées · 2 optimisées, 7,3 Mio économisés', error: '' });
  assert.deepEqual(summarizeImport({ ...base, photos: [{}], optimizedCount: 1, savedBytes: MIO }),
    { message: '1 photo ajoutée · 1 optimisée, 1,0 Mio économisés', error: '' });
  assert.deepEqual(summarizeImport({ ...base, photos: [{}] }),
    { message: '1 photo ajoutée · sans modification', error: '' });
  const failed = summarizeImport({ ...base, unreadableNames: ['x.jpg'], unoptimizedNames: ['y.jpg'] });
  assert.equal(failed.message, '');
  assert.match(failed.error, /illisible, non ajoutée : x\.jpg/);
  assert.match(failed.error, /original conservé : y\.jpg/);
});

const dossier = (...ids) => ({
  titre: 'Dossier',
  observations: ids.map((id) => ({ id, titre: id, photos: [{ id: `old-${id}`, name: 'ancienne.jpg', src: 'data:image/jpeg;base64,ANCIEN', horodatageISO: '2026-01-01T00:00:00.000Z' }] })),
});

test('les nouvelles photos s’ajoutent au bon constat sans toucher aux anciennes', () => {
  const report = dossier('a', 'b');
  const next = appendPhotos(report, 'b', [{ id: 'new', name: 'n.jpg', src: 'data:image/jpeg;base64,NEUF', horodatageISO: 't' }]);
  assert.deepEqual(next.observations[1].photos.map((photo) => photo.id), ['old-b', 'new']);
  assert.equal(next.observations[1].photos[0], report.observations[1].photos[0]);
  assert.equal(next.observations[0], report.observations[0]);
  assert.equal(report.observations[1].photos.length, 1);
});

test('un constat supprimé ou un autre dossier ne reçoit aucune photo', () => {
  const photo = { id: 'new', name: 'n.jpg', src: 'x', horodatageISO: 't' };
  const afterDeletion = dossier('a');
  assert.equal(appendPhotos(afterDeletion, 'b', [photo]), afterDeletion);
  const replacement = dossier('z');
  assert.equal(appendPhotos(replacement, 'b', [photo]), replacement);
  assert.equal(appendPhotos(replacement, 'z', []), replacement);
});

test('la mise à jour s’applique au dernier état, même modifié pendant le traitement', async () => {
  let report = dossier('a');
  const processing = importPhotoFiles([file('lent.jpg', 5 * MIO)], deps(MIO));
  report = { ...report, titre: 'Titre modifié pendant la compression' };
  const result = await processing;
  report = appendPhotos(report, 'a', result.photos);
  assert.equal(report.titre, 'Titre modifié pendant la compression');
  assert.equal(report.observations[0].photos.length, 2);
});

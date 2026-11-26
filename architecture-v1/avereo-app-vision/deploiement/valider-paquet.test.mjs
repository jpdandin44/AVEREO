import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { requis, validerPaquet } from './valider-paquet.mjs';

async function fixture(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'vision-paquet-'));
  try {
    for (const path of requis) { await mkdir(dirname(join(dir, path)), { recursive: true }); await writeFile(join(dir, path), 'contenu'); }
    await fn(dir);
  } finally { await rm(dir, { recursive: true, force: true }); }
}
test('paquet correct accepté et empreinte sensible au contenu', () => fixture(async (dir) => {
  const first = await validerPaquet(dir);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, await validerPaquet(dir));
  await writeFile(join(dir, 'sw.js'), 'nouveau');
  assert.notEqual(first, await validerPaquet(dir));
}));
for (const path of ['local/test.txt', 'revue/index.html', '.env', 'api/.env.production', 'config.php', 'api/config.php']) {
  test(`paquet refusé : ${path}`, () => fixture(async (dir) => {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), 'interdit');
    await assert.rejects(validerPaquet(dir), /interdit/);
  }));
}
for (const value of ['VITE_LOCAL_API_TOKEN', 'jeton-fictif-test-12345678901234567890']) {
  test('jeton ou nom de variable refusé sans exposer la valeur', () => fixture(async (dir) => {
    await writeFile(join(dir, 'sw.js'), value);
    await assert.rejects(validerPaquet(dir, 'jeton-fictif-test-12345678901234567890'), /Jeton local interdit : sw.js/);
  }));
}
test('fichier requis absent refusé', () => fixture(async (dir) => {
  await rm(join(dir, 'sw.js'));
  await assert.rejects(validerPaquet(dir), /obligatoire/);
}));

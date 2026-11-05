import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { preparePrivateImport } from '../workflows/preparer-import-prive.mjs';

const sandbox = { module: { exports: {} }, Date };
vm.runInNewContext(await readFile(new URL('../frontend/public/planning-core.js', import.meta.url), 'utf8'), sandbox);
const P = sandbox.module.exports;
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'projet-private-import-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source.json');
  const data = JSON.parse(P.encodeProject({ schemaVersion: 1, name: 'Projet fictif', startDate: '2026-11-09', capacityPerWeek: 5, schedulingMode: 'sequential', tasks: [{ id: 'A', name: 'Travail fictif', duration: 1, dependencies: [] }, { id: 'M', name: 'Jalon fictif', duration: 0, dependencies: ['A'] }] }));
  const bytes = JSON.stringify(data, null, 2) + '\n';
  await writeFile(source, bytes);
  return { root, source, data, bytes, target: path.join(root, 'paquet') };
}
test('private package preserves exact bytes and declares new independent import', async t => {
  const f = await fixture(t);
  const result = await preparePrivateImport(f.source, f.target);
  assert.equal(await readFile(path.join(f.target, 'planning.json'), 'utf8'), f.bytes);
  assert.equal(result.sha256, createHash('sha256').update(f.bytes).digest('hex'));
  assert.equal(result.taskCount, 2);
  assert.equal(result.milestoneCount, 1);
  assert.equal(result.totalDuration, 1);
  assert.equal(result.importMode, 'new-project');
  assert.equal(result.delivered, false);
  assert.ok(!JSON.stringify(result).includes('Projet fictif'));
  await assert.rejects(preparePrivateImport(f.source, f.target), { code: 'EEXIST' });
  assert.equal(await readFile(f.source, 'utf8'), f.bytes);
});
test('unknown fields cannot be silently discarded', async t => {
  const f = await fixture(t);
  f.data.tasks[0].unsupported = 'private detail';
  await writeFile(f.source, JSON.stringify(f.data));
  await assert.rejects(preparePrivateImport(f.source, f.target), /Normalisation/);
});
test('invalid dependencies cannot be packaged', async t => {
  const f = await fixture(t);
  f.data.tasks[0].dependencies = ['M'];
  await writeFile(f.source, JSON.stringify(f.data));
  await assert.rejects(preparePrivateImport(f.source, f.target));
});
test('public directories and other Git repositories are rejected', async t => {
  const f = await fixture(t);
  for (const name of ['public_html', 'dist', 'repo']) {
    const parent = path.join(f.root, name);
    await mkdir(parent);
    if (name === 'repo') await writeFile(path.join(parent, '.git'), 'gitdir: fictif');
    await assert.rejects(preparePrivateImport(f.source, path.join(parent, 'paquet')), /interdite/);
  }
  await assert.rejects(preparePrivateImport(f.source, path.join(f.root, 'public')), /interdite/);
});
test('junction into repository is resolved before destination validation', async t => {
  const f = await fixture(t);
  const alias = path.join(f.root, 'alias');
  const { fileURLToPath } = await import('node:url');
  await symlink(fileURLToPath(new URL('../../../', import.meta.url)), alias, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(preparePrivateImport(f.source, path.join(alias, 'paquet')), /interdite/);
});

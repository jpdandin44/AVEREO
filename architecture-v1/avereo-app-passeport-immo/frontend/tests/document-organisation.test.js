import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { Blob, File } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { createDocumentRepository } from '../src/documents/document-store.js';
import { documentSettings, movedDocumentSettings, orderedDocuments } from '../src/documents/document-settings.js';

let repo, other, client;
const file = name => new File([`%PDF-1.7\n${name}`], `${name}.pdf`);
beforeEach(async () => {
  vi.stubGlobal('Blob', Blob); vi.stubGlobal('File', File); vi.stubGlobal('crypto', webcrypto);
  const indexedDB = new IDBFactory(); repo = createDocumentRepository({ indexedDB }); other = createDocumentRepository({ indexedDB });
  client = await repo.linkClient('bien', { name: 'Client fictif corbeille' });
});
afterEach(async () => { await repo.close(); await other.close(); vi.unstubAllGlobals(); });

it('restaure un document archivé avec ses octets, son client et sa catégorie dans une autre session', async () => {
  await repo.addFiles('bien', [file('original')], 'plans');
  const doc = (await repo.load('bien')).documents[0];
  await repo.updateDocument('bien', doc.id, { title: 'Plan', category: 'plans', archived: true });
  const trash = await repo.trashDocument('bien', doc.id);
  expect(trash.trashedAt).toBeTruthy(); expect(trash.archivedAt).toBeTruthy();
  await expect(repo.updateDocument('bien', doc.id, { title: 'Erreur', category: 'autres' })).rejects.toThrow('Restaurez');
  const restored = await other.restoreDocument('bien', doc.id);
  expect(restored.trashedAt).toBeNull(); expect(restored.archivedAt).toBe(trash.archivedAt);
  expect(restored.clientId).toBe(client.id); expect(restored.category).toBe('plans');
  expect(await (await other.getFile('bien', doc.id)).text()).toBe(await file('original').text());
});
it('ne purge que la corbeille du bon bien, efface le blob et permet une nouvelle importation', async () => {
  await repo.addFiles('bien', [file('supprimer'), file('conserver')]);
  const doc = (await repo.load('bien')).documents.find(doc => doc.name === 'supprimer.pdf');
  await expect(repo.deleteDocument('bien', doc.id)).rejects.toThrow('corbeille');
  await expect(repo.trashDocument('autre-bien', doc.id)).rejects.toThrow('introuvable');
  await repo.trashDocument('bien', doc.id); await expect(other.deleteDocument('autre-bien', doc.id)).rejects.toThrow('introuvable');
  await other.deleteDocument('bien', doc.id);
  await expect(repo.getFile('bien', doc.id)).rejects.toThrow('introuvable');
  await expect(repo.restoreDocument('bien', doc.id)).rejects.toThrow('introuvable');
  expect((await repo.load('bien')).documents).toHaveLength(1);
  expect((await repo.load('bien')).client.id).toBe(client.id);
  expect((await repo.addFiles('bien', [file('supprimer')])).added).toBe(1);
});
it('signale un doublon dans la corbeille et annule tout le nouveau lot', async () => {
  await repo.addFiles('bien', [file('ancien')]); const doc = (await repo.load('bien')).documents[0]; await repo.trashDocument('bien', doc.id);
  await expect(repo.addFiles('bien', [file('nouveau'), file('ancien')])).rejects.toThrow('corbeille');
  expect((await other.load('bien')).documents).toHaveLength(1);
});
it('partage apparence et ordre par bien, refuse une écriture périmée et des références étrangères', async () => {
  await repo.addFiles('bien', [file('a'), file('b')], 'plans'); const data = await repo.load('bien');
  const settings = documentSettings(data.settings), ids = data.documents.map(doc => doc.id);
  settings.categories.plans = { icon: 'leaf', color: '#123456' }; settings.order.plans = [...ids].reverse();
  await repo.saveDocumentSettings('bien', settings);
  const stored = await other.load('bien'); expect(stored.settings.categories.plans).toEqual(settings.categories.plans);
  expect(orderedDocuments(stored.documents, stored.settings, 'plans').map(doc => doc.id)).toEqual(settings.order.plans);
  await expect(other.saveDocumentSettings('bien', settings)).rejects.toThrow('autre fenêtre');
  await repo.linkClient('bien', { clientId: client.id }); expect((await repo.load('bien')).settings).toEqual(stored.settings);
  await expect(repo.saveDocumentSettings('bien', { ...stored.settings, order: { plans: ['document-etranger'] } })).rejects.toThrow('Ordre');
  await expect(repo.saveDocumentSettings('bien', { ...stored.settings, categories: { plans: { icon: 'script', color: 'url(evil)' } } })).rejects.toThrow('Icône');
  await expect(repo.saveDocumentSettings('bien', { ...stored.settings, categories: { toString: { icon: 'leaf', color: '#123456' } } })).rejects.toThrow('Icône');
  const doc = stored.documents[0]; await repo.updateDocument('bien', doc.id, { title: doc.title, category: 'autres', archived: false });
  const changed = await repo.load('bien'); expect(changed.settings.order.plans).not.toContain(doc.id);
  await repo.saveDocumentSettings('bien', changed.settings);
});
it('conserve la place des fichiers masqués lors du déplacement dans un dossier', () => {
  const docs = ['a', 'b', 'c'].map(id => ({ id, category: 'plans', addedAt: '2026-11-13' }));
  const settings = { ...documentSettings(), order: { plans: ['a', 'b', 'c'] } };
  const next = movedDocumentSettings(docs, settings, [docs[0], docs[2]], 'c', -1);
  expect(next.order.plans).toEqual(['c', 'b', 'a']); expect(settings.order.plans).toEqual(['a', 'b', 'c']);
});

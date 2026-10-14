import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { Blob, File } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { createDocumentRepository, MAX_FILE_SIZE, validateFiles } from '../src/documents/document-store.js';

let factory, repository;
const file = (name = 'diagnostic.pdf', content = '%PDF-1.7\nDiagnostic fictif') => new File([content], name, { type: 'application/pdf' });
beforeEach(() => {
  vi.stubGlobal('Blob', Blob); vi.stubGlobal('File', File); vi.stubGlobal('crypto', webcrypto);
  factory = new IDBFactory(); repository = createDocumentRepository({ indexedDB: factory });
});
afterEach(async () => { await repository.close(); vi.unstubAllGlobals(); });

describe('Documents liés au client et au bien', () => {
  it('refuse un import sans client et conserve un dossier vide', async () => {
    await expect(repository.addFiles('bien-1', [file()])).rejects.toThrow('client');
    expect((await repository.load('bien-1')).documents).toHaveLength(0);
  });
  it('relie plusieurs biens au même client et isole leurs documents', async () => {
    const client = await repository.linkClient('bien-1', { name: 'Client fictif' });
    await repository.linkClient('bien-2', { clientId: client.id });
    await repository.addFiles('bien-1', [file()], 'diagnostics');
    const first = await repository.load('bien-1'), second = await repository.load('bien-2');
    expect(second.client.id).toBe(first.client.id); expect(second.documents).toHaveLength(0);
    await expect(repository.getFile('bien-2', first.documents[0].id)).rejects.toThrow('ce bien');
  });
  it('détecte les doublons par contenu malgré un changement de nom, y compris dans le même lot', async () => {
    await repository.linkClient('bien-1', { name: 'Client fictif' });
    expect(await repository.addFiles('bien-1', [file(), file('copie.pdf'), file('plan.pdf', '%PDF-1.7\nPlan fictif')])).toEqual({ added: 2, duplicates: 1 });
    expect(await repository.addFiles('bien-1', [file('nouveau-nom.pdf')])).toEqual({ added: 0, duplicates: 1 });
    expect((await repository.load('bien-1')).documents).toHaveLength(2);
  });
  it('deux imports concurrents ne créent pas deux copies du même contenu', async () => {
    await repository.linkClient('bien-1', { name: 'Client fictif' });
    const results = await Promise.all([repository.addFiles('bien-1', [file()]), repository.addFiles('bien-1', [file()])]);
    expect(results.reduce((n,r) => n+r.added, 0)).toBe(1);
    expect((await repository.load('bien-1')).documents).toHaveLength(1);
  });
  it('rejette entièrement un lot contenant un format interdit ou un faux PDF', async () => {
    await repository.linkClient('bien-1', { name: 'Client fictif' });
    await expect(repository.addFiles('bien-1', [file(), file('page.html', '<script>')])).rejects.toThrow('Format');
    await expect(repository.addFiles('bien-1', [file(), file('faux.pdf', 'texte sans en-tête PDF')])).rejects.toThrow('PDF lisible');
    expect((await repository.load('bien-1')).documents).toHaveLength(0);
  });
  it('borne les volumes et refuse un fichier vide', () => {
    expect(() => validateFiles([{ name: 'grand.pdf', size: MAX_FILE_SIZE+1 }])).toThrow('25 Mo');
    expect(() => validateFiles([{ name: 'vide.pdf', size: 0 }])).toThrow('vide');
    expect(() => validateFiles(Array.from({ length: 5 }, () => ({ name: 'lot.pdf', size: MAX_FILE_SIZE })))).toThrow('100 Mo');
  });
  it('conserve les fichiers et le client après fermeture et réouverture du stockage', async () => {
    await repository.linkClient('bien-1', { name: 'Client fictif' });
    await repository.addFiles('bien-1', [file()]);
    await repository.close(); repository = createDocumentRepository({ indexedDB: factory });
    const dossier = await repository.load('bien-1');
    expect(dossier.client.name).toBe('Client fictif'); expect(dossier.documents).toHaveLength(1);
    expect(await (await repository.getFile('bien-1', dossier.documents[0].id)).text()).toBe('%PDF-1.7\nDiagnostic fictif');
  });
  it('empêche de remplacer le client d’un dossier rempli et annule aussi la création du nouveau client', async () => {
    await repository.linkClient('bien-1', { name: 'Client fictif' }); await repository.addFiles('bien-1', [file()]);
    await expect(repository.linkClient('bien-1', { name: 'Autre client fictif' })).rejects.toThrow('remplacé');
    const dossier = await repository.load('bien-1');
    expect(dossier.client.name).toBe('Client fictif'); expect(dossier.clients).toHaveLength(1);
  });
  it('renomme, classe, archive et restaure sans modifier les octets du fichier', async () => {
    const longName = `${'d'.repeat(240)}.pdf`;
    await repository.linkClient('bien-1', { name: 'Client fictif' }); await repository.addFiles('bien-1', [file(longName)]);
    const doc = (await repository.load('bien-1')).documents[0];
    expect(doc.name).toBe(longName); expect(doc.title).toHaveLength(200);
    await repository.updateDocument('bien-1', doc.id, { title: doc.title, category: doc.category, archived: true });
    await repository.updateDocument('bien-1', doc.id, { title: 'Diagnostic du bien', category: 'diagnostics', archived: true });
    expect((await repository.load('bien-1')).documents[0]).toMatchObject({ title: 'Diagnostic du bien', category: 'diagnostics', sha256: doc.sha256 });
    expect((await repository.load('bien-1')).documents[0].archivedAt).toBeTruthy();
    await repository.updateDocument('bien-1', doc.id, { title: 'Diagnostic du bien', category: 'diagnostics', archived: false });
    expect((await repository.load('bien-1')).documents[0].archivedAt).toBeNull();
    expect(await (await repository.getFile('bien-1', doc.id)).text()).toContain('Diagnostic fictif');
  });
  it('refuse de modifier un document d’un autre bien', async () => {
    await repository.linkClient('bien-1', { name: 'Client fictif' }); await repository.addFiles('bien-1', [file()]);
    const doc = (await repository.load('bien-1')).documents[0];
    await expect(repository.updateDocument('bien-2', doc.id, { title: 'Incorrect', category: 'autres' })).rejects.toThrow('ce bien');
    expect((await repository.load('bien-1')).documents[0].title).toBe(doc.title);
  });
});

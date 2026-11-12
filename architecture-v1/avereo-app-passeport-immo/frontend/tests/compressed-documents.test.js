import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Blob, File } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { IDBFactory } from 'fake-indexeddb';
import fixtures from '../../tests/fixtures/archives.json';
import { createDocumentRepository, DOCUMENT_ACCEPT, MAX_FILE_SIZE, validateFiles } from '../src/documents/document-store.js';

const archive = fixture => new File([Buffer.from(fixture.base64, 'base64')], fixture.name, {type: 'application/octet-stream'});
let repository, factory;
beforeEach(async () => {
  vi.stubGlobal('Blob',Blob); vi.stubGlobal('File',File); vi.stubGlobal('crypto',webcrypto);
  factory=new IDBFactory(); repository=createDocumentRepository({indexedDB:factory});
  await repository.linkClient('bien-archives',{name:'Client fictif archives'});
});
afterEach(async () => { await repository.close(); vi.unstubAllGlobals(); });

describe('Conservation des archives du bien', () => {
  it.each(fixtures)('enregistre et restitue les octets de $name, indépendamment du MIME navigateur', async fixture => {
    const file=archive(fixture);
    expect(validateFiles([file])).toEqual([fixture.mime]);
    expect(await repository.addFiles('bien-archives',[file])).toEqual({added:1,duplicates:0});
    await repository.close(); repository=createDocumentRepository({indexedDB:factory});
    const dossier=await repository.load('bien-archives');
    expect(dossier.documents).toHaveLength(1);
    expect(dossier.documents[0]).toMatchObject({name:fixture.name,mime:fixture.mime,size:file.size});
    expect(Buffer.from(await (await repository.getFile('bien-archives',dossier.documents[0].id)).arrayBuffer()))
      .toEqual(Buffer.from(fixture.base64,'base64'));
    await expect(repository.getFile('autre-bien',dossier.documents[0].id)).rejects.toThrow('ce bien');
  });
  it('détecte un doublon renommé et conserve le fichier après classement, archivage et restauration', async () => {
    const f=fixtures[0], file=archive(f);
    await repository.addFiles('bien-archives',[file]);
    expect(await repository.addFiles('bien-archives',[new File([await file.arrayBuffer()],'copie.ZIP')])).toEqual({added:0,duplicates:1});
    const doc=(await repository.load('bien-archives')).documents[0];
    await repository.updateDocument('bien-archives',doc.id,{title:'Dossier complet',category:'juridique',archived:true});
    expect((await repository.load('bien-archives')).documents[0].archivedAt).toBeTruthy();
    await repository.updateDocument('bien-archives',doc.id,{title:'Dossier complet',category:'juridique',archived:false});
    expect(Buffer.from(await (await repository.getFile('bien-archives',doc.id)).arrayBuffer())).toEqual(Buffer.from(f.base64,'base64'));
  });
  it.each(['zip','7z','rar','tar','gz','tgz'])('rejette atomiquement une fausse archive .%s et un conteneur tronqué', async extension => {
    const wrong=new File(['<html>Ce fichier n’est pas une archive.</html>'],`faux.${extension}`);
    await expect(repository.addFiles('bien-archives',[archive(fixtures[0]),wrong])).rejects.toThrow('format d’archive');
    const fixture=fixtures.find(f=>f.name.endsWith(`.${extension}`));
    const truncated=new File([Buffer.from(fixture.base64,'base64').subarray(0,4)],`tronque.${extension}`);
    await expect(repository.addFiles('bien-archives',[truncated])).rejects.toThrow('format d’archive');
    expect((await repository.load('bien-archives')).documents).toHaveLength(0);
  });
  it('propose les archives sans autoriser tous les formats et conserve les limites existantes', () => {
    for (const ext of ['zip','7z','rar','tar','gz','tgz']) expect(DOCUMENT_ACCEPT.split(',')).toContain(`.${ext}`);
    expect(()=>validateFiles([{name:'script.exe',size:100}])).toThrow('Format non pris en charge');
    expect(()=>validateFiles([{name:'gros.zip',size:MAX_FILE_SIZE+1}])).toThrow('500 Mo');
    expect(()=>validateFiles([{name:'vide.zip',size:0}])).toThrow('vide');
    expect(()=>validateFiles(Array.from({length:5},()=>({name:'lot.zip',size:MAX_FILE_SIZE})))).toThrow('500 Mo');
  });
});

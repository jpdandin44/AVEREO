import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { documentSettings } from '../src/documents/document-settings.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DocumentsPanel from '../src/documents/DocumentsPanel.jsx';
vi.mock('../src/documents/PdfPreview.jsx', () => ({ default: ({ url, title }) => <div title={`PDF : ${title}`} data-url={url}>Lecteur de test</div> }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('sépare corbeille et archives, restaure et exige une confirmation avant la purge', async () => {
  let trashed = false, deleted = false;
  const repository = {
    load: async () => ({ client, clients: [client], documents: deleted ? [] : [{ ...document, trashedAt: trashed ? '2026-11-13' : null }] }),
    trashDocument: vi.fn(async () => { trashed = true; }), restoreDocument: vi.fn(async () => { trashed = false; }), deleteDocument: vi.fn(async () => { deleted = true; })
  };
  render(<DocumentsPanel bien={bien} repository={repository} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Mettre à la corbeille' }));
  await screen.findByRole('button', { name: 'Corbeille (1)' });
  expect(screen.queryByRole('heading', { name: document.title })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Corbeille (1)' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Restaurer le document' }));
  await screen.findByRole('button', { name: 'Corbeille (0)' });
  fireEvent.click(screen.getByRole('button', { name: 'Documents (1)' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Mettre à la corbeille' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Corbeille (1)' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Supprimer définitivement', exact: true }));
  const dialog = screen.getByRole('dialog', { name: 'Supprimer définitivement ce document ?' });
  expect(repository.deleteDocument).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));
  expect(repository.deleteDocument).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmer la suppression définitive' }));
  await screen.findByRole('heading', { name: 'La corbeille est vide' });
  expect(repository.deleteDocument).toHaveBeenCalledWith('1', document.id);
});

it('regroupe, replie, personnalise et réordonne les fichiers dans leur dossier', async () => {
  let settings = documentSettings();
  const second = { ...document, id: 'second', title: 'Autre plan', name: 'autre.pdf' };
  const repository = {
    load: async () => ({ client, clients: [client], documents: [document, second], settings }),
    saveDocumentSettings: vi.fn(async (id, value) => { settings = { ...value, revision: value.revision + 1 }; })
  };
  render(<DocumentsPanel bien={bien} repository={repository} />);
  const folder = await screen.findByRole('region', { name: 'Dossier Plans et façades' });
  expect(within(folder).getAllByRole('heading', { level: 4 })).toHaveLength(2);
  fireEvent.click(within(folder).getByRole('button', { name: /Plans et façades/ }));
  expect(within(folder).queryByRole('heading', { level: 4 })).toBeNull();
  fireEvent.click(within(folder).getByRole('button', { name: /Plans et façades/ }));
  fireEvent.click(within(folder).getByRole('button', { name: 'Monter : Autre plan' }));
  await waitFor(() => expect(within(folder).getAllByRole('heading', { level: 4 })[0].textContent).toBe('Autre plan'));
  fireEvent.click(screen.getByRole('button', { name: 'Personnaliser les catégories' }));
  fireEvent.change(screen.getByLabelText('Icône : Plans et façades'), { target: { value: 'leaf' } });
  fireEvent.change(screen.getByLabelText('Couleur : Plans et façades'), { target: { value: '#123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les catégories' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(settings.categories.plans).toEqual({ icon: 'leaf', color: '#123456' });
  expect(repository.saveDocumentSettings).toHaveBeenCalledTimes(2);
});
const bien = { id: 1, address: 'Bien fictif', dossier: { attachments: [] } };
const client = { id: 'client-1', name: 'Client fictif' };
const document = { id: 'doc-1', title: 'Plan du bien', name: 'plan.pdf', category: 'plans', mime: 'application/pdf', size: 2500, addedAt: '2026-10-14T10:00:00Z', archivedAt: null };
describe('Parcours documentaire', () => {
  it('propose une archive en téléchargement sans lecteur PDF ni extraction', async () => {
    vi.stubGlobal('URL',{createObjectURL:vi.fn(()=>'blob:archive-fictive'),revokeObjectURL:vi.fn()});
    const compressed={...document,name:'dossier.zip',title:'Dossier complet',mime:'application/zip'};
    const repository={load:async()=>({client,clients:[client],documents:[compressed]}),getFile:async()=>new Blob(['archive fictive'])};
    render(<DocumentsPanel bien={bien} repository={repository}/>);
    fireEvent.click(await screen.findByRole('button',{name:'Consulter'}));
    await screen.findByText('Archive compressée conservée dans le dossier du bien.');
    expect(screen.getByRole('link',{name:'Télécharger le document'}).getAttribute('download')).toBe('dossier.zip');
    expect(screen.queryByTitle('PDF : Dossier complet')).toBeNull();
    expect(screen.getByLabelText('Fichiers à ajouter au dossier du bien').getAttribute('accept').split(',')).toContain('.zip');
    fireEvent.click(screen.getByRole('button',{name:'Fermer'}));
    vi.unstubAllGlobals();
  });
  it('demande le client avant l’import et conserve l’association confirmée', async () => {
    let linked = false;
    const repository = { load: vi.fn(async () => ({ client: linked ? client : null, clients: [], documents: [] })), linkClient: vi.fn(async () => { linked = true; }) };
    render(<DocumentsPanel bien={bien} repository={repository} />);
    await screen.findByRole('button', { name: 'Associer le client' });
    expect(screen.getByRole('heading', { name: '1. Associer le client' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ajouter des fichiers' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Importer un dossier' }).disabled).toBe(true);
    expect(screen.getByText('Associez d’abord le client ci-dessus pour activer ces boutons.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Nom du client ou raison sociale'), { target: { value: client.name } });
    fireEvent.click(screen.getByRole('button', { name: 'Associer le client' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ajouter des fichiers' }).disabled).toBe(false));
    expect(screen.queryByText('Associez d’abord le client ci-dessus pour activer ces boutons.')).toBeNull();
    expect(repository.linkClient).toHaveBeenCalledWith('1', { clientId: undefined, name: client.name });
  });
  it('garde l’import désactivé si l’association échoue et affiche la cause', async () => {
    const repository = { load: async () => ({ client: null, clients: [], documents: [] }), linkClient: vi.fn(async () => { throw new Error('Association indisponible'); }) };
    render(<DocumentsPanel bien={bien} repository={repository} />);
    await screen.findByRole('button', { name: 'Associer le client' });
    fireEvent.change(screen.getByLabelText('Nom du client ou raison sociale'), { target: { value: client.name } });
    fireEvent.click(screen.getByRole('button', { name: 'Associer le client' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Association indisponible');
    expect(screen.getByRole('button', { name: 'Ajouter des fichiers' }).disabled).toBe(true);
    expect(screen.queryByText('Client associé. Vous pouvez maintenant ajouter des fichiers.')).toBeNull();
  });
  it.each([false, true])('explique l’enregistrement des fichiers sur la bonne cible (serveur : %s)', async server => {
    const repository = { server, load: async () => ({ client, clients: [client], documents: [] }) };
    render(<DocumentsPanel bien={bien} repository={repository} />);
    await screen.findByRole('button', { name: 'Ajouter des fichiers' });
    expect(screen.getByText('Enregistrement automatique des fichiers')).toBeTruthy();
    expect(screen.getByText('Chaque fichier est enregistré dès son ajout. Aucun bouton « Enregistrer » supplémentaire n’est nécessaire pour l’import.')).toBeTruthy();
    expect(screen.getByText(server
      ? 'Stockage : serveur privé. Retrouvez les documents depuis vos appareils avec votre compte CONNECT.'
      : 'Stockage : ce navigateur, sur ce PC uniquement. Téléchargez une copie pour la conserver ailleurs.')).toBeTruthy();
  });
  it('confirme l’import uniquement après son enregistrement, sans action Enregistrer supplémentaire', async () => {
    let finish, imported = false;
    const file = new File(['%PDF-1.7'], 'plan.pdf', { type: 'application/pdf' });
    const repository = {
      load: async () => ({ client, clients: [client], documents: imported ? [document] : [] }),
      addFiles: vi.fn(() => new Promise(resolve => { finish = () => { imported = true; resolve({ added: 1, duplicates: 0 }); }; }))
    };
    render(<DocumentsPanel bien={bien} repository={repository} />);
    fireEvent.change(await screen.findByLabelText('Fichiers à ajouter au dossier du bien'), { target: { files: [file] } });
    expect(screen.queryByText('1 document(s) ajouté(s).')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Enregistrement…' }).disabled).toBe(true);
    finish();
    await screen.findByText('1 document(s) ajouté(s).');
    expect(screen.getByRole('heading', { name: 'Plan du bien' })).toBeTruthy();
    expect(repository.addFiles).toHaveBeenCalledWith('1', [file], 'autres');
  });
  it('filtre les documents et libère l’aperçu à sa fermeture', async () => {
    const create = vi.fn(() => 'blob:exemple-local'), revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    const repository = { load: async () => ({ client, clients: [client], documents: [document] }), getFile: async () => new Blob(['%PDF-1.7']) };
    render(<DocumentsPanel bien={bien} repository={repository} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Consulter' }));
    await waitFor(() => expect(screen.getByTitle('PDF : Plan du bien').getAttribute('data-url')).toContain('blob:exemple-local'));
    expect(screen.getByRole('link', { name: 'Télécharger le document' }).getAttribute('download')).toBe('plan.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(revoke).toHaveBeenCalledWith('blob:exemple-local');
    fireEvent.change(screen.getByLabelText('Rechercher'), { target: { value: 'absent' } });
    expect(screen.queryByRole('button', { name: 'Consulter' })).toBeNull();
    vi.unstubAllGlobals();
  });
  it('affiche la progression et les documents confirmés après l’échec d’un lot ultérieur', async () => {
    let failSecond;
    const repository = {
      load: async () => ({ client, clients: [client], documents: repository.addFiles.mock.calls.length ? [document] : [] }),
      addFiles: vi.fn().mockResolvedValueOnce({ added: 1, duplicates: 0 }).mockImplementationOnce(() => new Promise((resolve, reject) => { failSecond = () => reject(new Error('Connexion interrompue')); }))
    };
    const files = ['a.zip', 'b.zip', 'c.zip'].map(name => ({ name, size: 300 * 1024 * 1024 }));
    render(<DocumentsPanel bien={bien} repository={repository} />);
    fireEvent.change(await screen.findByLabelText('Fichiers à ajouter au dossier du bien'), { target: { files } });
    await screen.findByText(/Envoi du lot 2 sur 3 · 1 fichier/);
    expect(screen.getByRole('button', { name: 'Enregistrement…' }).disabled).toBe(true);
    failSecond();
    await screen.findByText('Envoi interrompu au lot 2 sur 3 : Connexion interrompue');
    await screen.findByRole('heading', { name: 'Plan du bien' });
    expect(screen.getByText(/1 document\(s\) ajouté\(s\).*avant l’interruption/)).toBeTruthy();
    expect(repository.addFiles).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Ajouter des fichiers' }).disabled).toBe(false);
  });
  it('signale le fichier supérieur à 500 Mo avant d’enregistrer les autres', async () => {
    const repository = { load: async () => ({ client, clients: [client], documents: [] }), addFiles: vi.fn() };
    render(<DocumentsPanel bien={bien} repository={repository} />);
    fireEvent.change(await screen.findByLabelText('Fichiers à ajouter au dossier du bien'), { target: { files: [{ name: 'rapport.pdf', size: 173*1024*1024 }, { name: 'trop-grand.zip', size: 501*1024*1024 }] } });
    expect((await screen.findByRole('alert')).textContent).toContain('trop-grand.zip');
    expect(screen.getByRole('alert').textContent).toContain('500 Mo');
    expect(repository.addFiles).not.toHaveBeenCalled();
  });
});

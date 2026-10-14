import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DocumentsPanel from '../src/documents/DocumentsPanel.jsx';
vi.mock('../src/documents/PdfPreview.jsx', () => ({ default: ({ url, title }) => <div title={`PDF : ${title}`} data-url={url}>Lecteur de test</div> }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const bien = { id: 1, address: 'Bien fictif', dossier: { attachments: [] } };
const client = { id: 'client-1', name: 'Client fictif' };
const document = { id: 'doc-1', title: 'Plan du bien', name: 'plan.pdf', category: 'plans', mime: 'application/pdf', size: 2500, addedAt: '2026-10-14T10:00:00Z', archivedAt: null };
describe('Parcours documentaire', () => {
  it('demande le client avant l’import et conserve l’association confirmée', async () => {
    let linked = false;
    const repository = { load: vi.fn(async () => ({ client: linked ? client : null, clients: [], documents: [] })), linkClient: vi.fn(async () => { linked = true; }) };
    render(<DocumentsPanel bien={bien} repository={repository} />);
    await screen.findByRole('button', { name: 'Associer le client' });
    expect(screen.queryByRole('button', { name: 'Ajouter des fichiers' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Nom du client ou raison sociale'), { target: { value: client.name } });
    fireEvent.click(screen.getByRole('button', { name: 'Associer le client' }));
    await screen.findByRole('button', { name: 'Ajouter des fichiers' });
    expect(repository.linkClient).toHaveBeenCalledWith('1', { clientId: undefined, name: client.name });
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
});

import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import DocumentsPanel from '../src/documents/DocumentsPanel.jsx';
import { SharedDocuments } from '../src/documents/Sharing.jsx';
import App from '../src/App.jsx';
vi.mock('../src/documents/PdfPreview.jsx', () => ({ default: ({ title }) => <div>PDF : {title}</div> }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const bien = { id: 'library', address: 'Bien fictif bibliothèque', dossier: { attachments: [] } };
const client = { id: 'client', name: 'Client fictif' };
const plan = { id: 'plan', title: 'Plan fictif', name: 'plan.pdf', mime: 'application/pdf', category: 'plans', size: 1000, addedAt: '2026-11-24' };
const archive = { ...plan, id: 'zip', title: 'Dossier fictif', name: 'dossier.zip', mime: 'application/zip', category: 'autres' };

it('affiche l’aperçu choisi, le libère au changement et ne charge pas automatiquement une archive', async () => {
  const revoke = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:fictif'), revokeObjectURL: revoke });
  const repository = { load: async () => ({ client, clients: [], documents: [plan, archive] }), getFile: vi.fn(async () => new Blob(['fictif'])) };
  render(<DocumentsPanel bien={bien} repository={repository} />);
  fireEvent.click(await screen.findByRole('button', { name: plan.title }));
  const preview = screen.getByRole('complementary', { name: 'Aperçu du document' });
  expect(await within(preview).findByText(`PDF : ${plan.title}`)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: archive.title }));
  expect(screen.getByText('Archive conservée entière, sans extraction.')).toBeTruthy();
  expect(revoke).toHaveBeenCalledWith('blob:fictif');
  expect(repository.getFile).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Fermer l’aperçu' }));
  expect(screen.getByText('Un document à portée de main')).toBeTruthy();
});

it('garde le filtre, le dossier replié et le brouillon lors d’un changement de rubrique', async () => {
  const repository = { load: vi.fn(async () => ({ client, clients: [], documents: [plan, archive] })) };
  const { rerender } = render(<DocumentsPanel bien={bien} repository={repository} />);
  await screen.findByRole('button', { name: plan.title });
  fireEvent.change(screen.getByLabelText('Rechercher'), { target: { value: 'Plan' } });
  fireEvent.click(within(screen.getByRole('region', { name: 'Dossier Plans et façades' })).getByRole('button', { name: /Plans et façades/ }));
  rerender(<DocumentsPanel bien={bien} repository={repository} section="rapports" />);
  expect(screen.queryByLabelText('Rechercher')).toHaveProperty('value', 'Plan');
  rerender(<DocumentsPanel bien={bien} repository={repository} section="documents" />);
  expect(screen.getByLabelText('Rechercher')).toHaveProperty('value', 'Plan');
  expect(screen.queryByRole('button', { name: plan.title })).toBeNull();
  expect(repository.load).toHaveBeenCalledTimes(1);
});

it('amène l’aperçu dans le parcours clavier sur petit écran et rend le focus à sa fermeture', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const repository = { load: async () => ({ client, clients: [], documents: [archive] }) };
  render(<DocumentsPanel bien={bien} repository={repository} />);
  const title = await screen.findByRole('button', { name: archive.title });
  title.focus(); fireEvent.click(title);
  expect(document.activeElement).toBe(screen.getByRole('complementary', { name: 'Aperçu du document' }));
  fireEvent.click(screen.getByRole('button', { name: 'Fermer l’aperçu' }));
  expect(document.activeElement).toBe(title);
});

it('reprend uniquement les lots non confirmés, dans leur catégorie d’origine', async () => {
  const files = ['a.zip', 'b.zip', 'c.zip'].map(name => ({ name, size: 300 * 1024 * 1024 }));
  const repository = { load: async () => ({ client, clients: [], documents: [] }), addFiles: vi.fn()
    .mockResolvedValueOnce({ added: 1, duplicates: 0 }).mockRejectedValueOnce(new Error('Interruption fictive'))
    .mockResolvedValue({ added: 1, duplicates: 0 }) };
  render(<DocumentsPanel bien={bien} repository={repository} />);
  fireEvent.change(await screen.findByLabelText('Classer les nouveaux documents'), { target: { value: 'plans' } });
  fireEvent.change(screen.getByLabelText('Fichiers à ajouter au dossier du bien'), { target: { files } });
  fireEvent.click(await screen.findByRole('button', { name: 'Reprendre les fichiers restants (2)' }));
  await screen.findByText('2 document(s) ajouté(s).');
  expect(repository.addFiles.mock.calls.map(call => call[1])).toEqual([[files[0]], [files[1]], [files[1]], [files[2]]]);
  expect(repository.addFiles.mock.calls.every(call => call[2] === 'plans')).toBe(true);
  expect(screen.queryByRole('button', { name: /Reprendre les fichiers restants/ })).toBeNull();
});

it('préserve la recherche reçue à l’actualisation, puis ferme le dossier sur révocation', async () => {
  const detail = { bien, client: null, clients: [], documents: [plan, archive] };
  const repository = { incomingShares: async () => ({ shares: [{ id: 'share', address: bien.address, ownerLabel: 'Propriétaire fictif' }] }), sharedDocuments: vi.fn(async () => ({ ...detail })) };
  render(<SharedDocuments online repository={repository} />);
  fireEvent.click(await screen.findByRole('button', { name: `Ouvrir les documents de ${bien.address}` }));
  fireEvent.change(await screen.findByLabelText('Rechercher'), { target: { value: 'Plan' } });
  fireEvent.click(screen.getByRole('button', { name: 'Actualiser les partages' }));
  await waitFor(() => expect(repository.sharedDocuments).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText('Rechercher')).toHaveProperty('value', 'Plan');
  expect(screen.queryByRole('button', { name: archive.title })).toBeNull();
  expect(screen.queryByRole('button', { name: /Actions :/ })).toBeNull();
  expect(screen.queryByRole('region', { name: 'Rapports privés du bien' })).toBeNull();
  repository.sharedDocuments.mockRejectedValueOnce(new Error('Accès révoqué'));
  fireEvent.click(screen.getByRole('button', { name: 'Actualiser les partages' }));
  await screen.findByRole('alert');
  expect(screen.queryByLabelText('Rechercher')).toBeNull();
});

it('sépare documents et travaux et conserve la pièce en cours de saisie', async () => {
  localStorage.clear();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter', exact: true }));
  fireEvent.click(screen.getByRole('heading', { name: '123 Rue de la République, 75001 Paris', exact: true }));
  expect(screen.getByRole('button', { name: 'Documents', exact: true }).getAttribute('aria-current')).toBe('page');
  expect(screen.queryByRole('button', { name: 'Exporter en PDF' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Travaux et devis' }));
  fireEvent.click(screen.getByRole('button', { name: 'Modifier les interventions : Salon' }));
  expect(screen.getByRole('heading', { name: 'Interventions pour: Salon' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Valider', exact: true }));
  expect(screen.queryByRole('heading', { name: 'Interventions pour: Salon' })).toBeNull();
  const input = screen.getByPlaceholderText('Nom (ex: Cuisine)');
  fireEvent.change(input, { target: { value: 'Pièce en cours' } });
  fireEvent.click(screen.getByRole('button', { name: 'Documents', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Travaux et devis' }));
  expect(screen.getByPlaceholderText('Nom (ex: Cuisine)')).toHaveProperty('value', 'Pièce en cours');
  expect(screen.getByRole('button', { name: 'Exporter en PDF' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter', exact: true }));
});

it('ouvre puis ferme le formulaire de bien avec ses champs nommés et son enregistrement natif', () => {
  localStorage.clear();
  const consoleError = vi.spyOn(console, 'error');
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Créer un bien' }));
  fireEvent.change(screen.getByLabelText('Adresse'), { target: { value: 'Bien fictif de recette UI' } });
  fireEvent.change(screen.getByLabelText('Surface (m²)'), { target: { value: '96' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder', exact: true }));
  expect(screen.getByRole('heading', { name: 'Bien fictif de recette UI' })).toBeTruthy();
  expect(JSON.parse(localStorage.getItem('avereo-passeport-immo-biens')).at(-1).size).toBe(96);
  fireEvent.click(screen.getByRole('button', { name: 'Créer un bien' }));
  expect(screen.getByLabelText('Adresse')).toHaveProperty('value', '');
  fireEvent.click(screen.getByRole('button', { name: 'Annuler', exact: true }));
  expect(consoleError).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter', exact: true }));
});

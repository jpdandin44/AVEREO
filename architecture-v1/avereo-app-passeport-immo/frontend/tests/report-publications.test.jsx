import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ReportPublications from '../src/documents/ReportPublications.jsx';
afterEach(cleanup);

it('explains the private copy and requires confirmation before adding a final document to existing shares', async () => {
  const item = { id: 'a'.repeat(32), title: 'Rapport fictif', reference: 'TEST', publishedAt: '2026-11-19T10:00:00Z' };
  const repository = { server: true, publications: vi.fn(async () => ({ publications: [] })), publishReport: vi.fn(async () => ({ publication: item, alreadyPublished: false })) };
  const onSaved = vi.fn(async () => {});
  render(<ReportPublications bienId="fictif" repository={repository} onSaved={onSaved} />);
  const file = new File(['fixture'], 'fictif.avereo.zip', { type: 'application/zip' });
  fireEvent.change(screen.getByLabelText('Choisir un dossier Rapport finalisé'), { target: { files: [file] } });
  const dialog = screen.getByRole('dialog', { name: 'Conserver cette version Rapport ?' });
  expect(within(dialog).getByText(/destinataires CONNECT actuels et futurs/)).toBeTruthy();
  expect(repository.publishReport).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));
  expect(repository.publishReport).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Choisir un dossier Rapport finalisé'), { target: { files: [file] } });
  repository.publications.mockResolvedValue({ publications: [item] });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmer la conservation de cette version' }));
  await screen.findByText('Rapport fictif');
  expect(repository.publishReport).toHaveBeenCalledWith('fictif', file);
  expect(onSaved).toHaveBeenCalledOnce();
});

it('keeps a failed publication review open and refuses ordinary archives', async () => {
  const repository = { server: true, publications: async () => ({ publications: [] }), publishReport: vi.fn(async () => { throw new Error('Import incomplet'); }) };
  render(<ReportPublications bienId="fictif" repository={repository} onSaved={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Choisir un dossier Rapport finalisé'), { target: { files: [new File(['x'], 'autre.zip')] } });
  expect(repository.publishReport).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Choisir un dossier Rapport finalisé'), { target: { files: [new File(['x'], 'test.avereo.zip')] } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmer la conservation de cette version' }));
  await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
  await waitFor(() => expect(screen.getAllByText('Import incomplet').length).toBeGreaterThan(0));
});

it('does not offer online conservation in the browser-only prototype', () => {
  render(<ReportPublications bienId="fictif" repository={{}} onSaved={vi.fn()} />);
  expect(screen.getByText(/nécessite l’espace en ligne/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Importer un dossier Rapport finalisé' })).toBeNull();
});

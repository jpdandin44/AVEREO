import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ReportReviews from '../src/documents/ReportReviews.jsx';

vi.mock('../src/documents/PdfPreview.jsx', () => ({ default: () => <p>PDF de contrôle</p> }));
afterEach(cleanup);
const item = { id: 'a'.repeat(32), title: 'Mission fictive', reference: 'REVUE', reviewerLabel: 'Expert A', ownerLabel: 'Compte fictif', submittedAt: '2026-11-25T10:00:00Z', status: 'pending', revision: 2, isOwner: false, canDecide: true, isLatest: true, files: { 'rapport-client.pdf': { sha256: 'c'.repeat(64) }, 'rapport-expert.pdf': { sha256: 'e'.repeat(64) } } };

it('requires a verified reviewer and explicit nomination before importing any private version', async () => {
  const repository = { reviews: vi.fn(async () => ({ revision: 3, reviews: [] })), resolveReviewer: vi.fn(async () => ({ recipient: 'avereo_connect:42', label: 'Expert A', ready: true })), submitReview: vi.fn(async () => ({})) };
  render(<ReportReviews bienId="bien-fictif" online repository={repository} />);
  await waitFor(() => expect(repository.reviews).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText('Fichier de demande de revue'), { target: { files: [new File(['fixture'], 'demande.review.avereo.zip')] } });
  fireEvent.change(screen.getByLabelText('Compte CONNECT du relecteur'), { target: { value: 'expert-a' } });
  fireEvent.click(screen.getByRole('button', { name: 'Vérifier le relecteur' }));
  await screen.findByText('Relecteur : Expert A');
  expect(repository.submitReview).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmer la demande privée de relecture' }));
  await waitFor(() => expect(repository.submitReview).toHaveBeenCalledOnce());
  expect(repository.submitReview.mock.calls[0].slice(2)).toEqual(['expert-a', 'avereo_connect:42', 3]);
});

it('requires a reason and confirmation for corrections and does not confuse that decision with approval', async () => {
  const repository = { reviews: vi.fn(async () => ({ reviews: [item] })), changeReview: vi.fn(async () => ({})) };
  render(<ReportReviews online repository={repository} />);
  const approve = await screen.findByRole('button', { name: 'Valider cette version' });
  expect(approve.disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Demander des corrections' }));
  const dialog = await screen.findByRole('dialog', { name: 'Demander des corrections ?' });
  const confirm = within(dialog).getByRole('button', { name: 'Confirmer' });
  fireEvent.click(within(dialog).getByRole('checkbox'));
  expect(confirm.disabled).toBe(true);
  fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Constat 2, page 4 : préciser la mesure.' } });
  fireEvent.click(confirm);
  await waitFor(() => expect(repository.changeReview).toHaveBeenCalledOnce());
  expect(repository.changeReview.mock.calls[0][1]).toMatchObject({ action: 'corrections', revision: 2, confirm: true, comment: 'Constat 2, page 4 : préciser la mesure.', pdfSha256: { client: 'c'.repeat(64), expert: 'e'.repeat(64) } });
});

it('rechecks the sharing recipients before a separate publication confirmation', async () => {
  const approved = { ...item, isOwner: true, status: 'approved', canDecide: false, bienId: 'bien-fictif' };
  const repository = { reviews: vi.fn(async () => ({ reviews: [approved] })), shares: vi.fn(async () => ({ revision: 7, grants: [{ label: 'Client fictif', revokedAt: null }] })), changeReview: vi.fn(async () => ({})) };
  render(<ReportReviews online repository={repository} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Publier le PDF client validé' }));
  const dialog = await screen.findByRole('dialog', { name: 'Publier le PDF client validé ?' });
  expect(within(dialog).getByText(/Client fictif/)).toBeTruthy();
  expect(repository.changeReview).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('checkbox'));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmer' }));
  await waitFor(() => expect(repository.changeReview).toHaveBeenCalledOnce());
  expect(repository.changeReview.mock.calls[0][1]).toMatchObject({ action: 'publish', shareRevision: 7 });
});

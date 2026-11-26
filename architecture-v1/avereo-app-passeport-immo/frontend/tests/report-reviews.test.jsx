import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ReportReviews from '../src/documents/ReportReviews.jsx';

vi.mock('../src/documents/PdfPreview.jsx', () => ({ default: () => <p>PDF de contrôle</p> }));
afterEach(cleanup);
const item = { id: 'a'.repeat(32), title: 'Mission fictive', reference: 'REVUE', reviewerLabel: 'Expert A', ownerLabel: 'Compte fictif', submittedAt: '2026-11-25T10:00:00Z', status: 'pending', revision: 2, isOwner: false, canDecide: true, isLatest: true, files: { 'rapport-client.docx': { sha256: 'c'.repeat(64) }, 'rapport-expert.docx': { sha256: 'e'.repeat(64) } } };

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
  const approve = await screen.findByRole('button', { name: 'Valider les Word' });
  expect(approve.disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Demander des corrections' }));
  const dialog = await screen.findByRole('dialog', { name: 'Demander des corrections ?' });
  const confirm = within(dialog).getByRole('button', { name: 'Confirmer' });
  fireEvent.click(within(dialog).getByRole('checkbox'));
  expect(confirm.disabled).toBe(true);
  fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Constat 2, page 4 : préciser la mesure.' } });
  fireEvent.click(confirm);
  await waitFor(() => expect(repository.changeReview).toHaveBeenCalledOnce());
  expect(repository.changeReview.mock.calls[0][1]).toMatchObject({ action: 'corrections', revision: 2, confirm: true, comment: 'Constat 2, page 4 : préciser la mesure.', wordSha256: { client: 'c'.repeat(64), expert: 'e'.repeat(64) } });
});

it('rechecks the sharing recipients before a separate publication confirmation', async () => {
  const approved = { ...item, isOwner: true, status: 'pdf_ready', wordApproved: true, canPublish: true, canDecide: false, bienId: 'bien-fictif' };
  const repository = { reviews: vi.fn(async () => ({ reviews: [approved] })), shares: vi.fn(async () => ({ revision: 7, grants: [{ label: 'Client fictif', revokedAt: null }] })), changeReview: vi.fn(async () => ({})) };
  render(<ReportReviews online repository={repository} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Publier le PDF client' }));
  const dialog = await screen.findByRole('dialog', { name: 'Publier le PDF client ?' });
  expect(within(dialog).getByText(/Client fictif/)).toBeTruthy();
  expect(repository.changeReview).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('checkbox'));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmer' }));
  await waitFor(() => expect(repository.changeReview).toHaveBeenCalledOnce());
  expect(repository.changeReview.mock.calls[0][1]).toMatchObject({ action: 'publish', shareRevision: 7 });
});

it('only offers final PDF preparation after Word approval and requires layout confirmation', async () => {
  const approved = { ...item, status: 'approved', isOwner: true, canDecide: false, wordApproved: true, canPreparePdf: true, decision: { basis: 'word', at: '2026-11-25T10:00:00Z', wordSha256: { client: 'c'.repeat(64), expert: 'e'.repeat(64) } } };
  const repository = { reviews: vi.fn(async () => ({ reviews: [approved] })), prepareReviewPdf: vi.fn(async () => ({})) };
  render(<ReportReviews online repository={repository} />);
  expect(screen.queryByRole('button', { name: 'Publier le PDF client' })).toBeNull();
  fireEvent.click(await screen.findByRole('button', { name: 'Préparer le PDF après validation Word' }));
  const dialog = await screen.findByRole('dialog', { name: 'Préparer le PDF après validation Word ?' });
  const confirm = within(dialog).getByRole('button', { name: 'Confirmer' });
  expect(confirm.disabled).toBe(true);
  const file = new File(['%PDF-1.4'], 'final.pdf', { type: 'application/pdf' });
  fireEvent.change(within(dialog).getByLabelText('PDF client issu du Word validé'), { target: { files: [file] } });
  expect(confirm.disabled).toBe(true);
  fireEvent.click(within(dialog).getByRole('checkbox'));
  fireEvent.click(confirm);
  await waitFor(() => expect(repository.prepareReviewPdf).toHaveBeenCalledWith(item.id, file, item.revision, 'c'.repeat(64)));
});

it('preserves a historical PDF decision without exposing Word-approved publication actions', async () => {
  const legacy = { ...item, status: 'approved', canDecide: false, isOwner: true, wordApproved: false, decision: { basis: 'pdf', at: '2026-11-25T10:00:00Z' } };
  render(<ReportReviews online repository={{ reviews: async () => ({ reviews: [legacy] }) }} />);
  await screen.findByText(/Ancienne validation PDF/);
  expect(screen.queryByRole('button', { name: 'Préparer le PDF après validation Word' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Publier le PDF client' })).toBeNull();
});

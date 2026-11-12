import { describe, expect, it, vi } from 'vitest';
import { importDocumentFiles, planDocumentImport } from '../src/documents/import-files.js';
import { MAX_BATCH_SIZE, MAX_FILE_SIZE } from '../src/documents/document-store.js';

const mib = 1024 * 1024;
// The planner reads File metadata only; no large allocation is needed here.
const file = (name, size) => ({ name, size });
const repository = () => ({ addFiles: vi.fn(async (id, files) => ({ added: files.length, duplicates: 0 })) });

describe('Envoi de documents volumineux', () => {
  it('envoie les quatorze archives de 203 Mo dans un seul lot, sans transformer les fichiers', async () => {
    const files = Array.from({ length: 14 }, (_, i) => file(`archive-${i}.zip`, (i === 13 ? 8 : 15) * mib));
    const repo = repository();
    const result = await importDocumentFiles(repo, 'bien', files, 'autres');
    expect(repo.addFiles).toHaveBeenCalledTimes(1);
    expect(repo.addFiles).toHaveBeenCalledWith('bien', files, 'autres');
    expect(result).toMatchObject({ added: 14, duplicates: 0, completedBatches: 1, processedFiles: 14 });
  });
  it('garde entier le rapport de 173 Mo et accepte la limite exacte de 500 Mo', () => {
    const report = file('rapport.pdf', 173 * mib), limit = file('limite.zip', MAX_FILE_SIZE);
    const batches = planDocumentImport([report, limit]);
    expect(batches).toEqual([[report], [limit]]);
    expect(batches[0][0]).toBe(report);
    expect(batches[1][0]).toBe(limit);
  });
  it('répartit les sélections supérieures à 500 Mo et 100 fichiers en lots séquentiels', async () => {
    const files = Array.from({ length: 205 }, (_, i) => file(`fichier-${i}.txt`, i < 3 ? 200 * mib : 1));
    let inFlight = 0, peak = 0;
    const repo = { addFiles: vi.fn(async (id, batch) => { inFlight++; peak = Math.max(peak, inFlight); await Promise.resolve(); inFlight--; return { added: batch.length, duplicates: 0 }; }) };
    const states = [];
    const result = await importDocumentFiles(repo, 'bien', files, 'plans', state => states.push(state));
    const batches = repo.addFiles.mock.calls.map(call => call[1]);
    expect(batches.flat()).toEqual(files);
    expect(batches.every(batch => batch.length <= 100 && batch.reduce((sum, f) => sum + f.size, 0) <= MAX_BATCH_SIZE)).toBe(true);
    expect(peak).toBe(1);
    expect(states[0].processedFiles).toBe(0);
    expect(states.at(-1).completedBatches).toBe(batches.length - 1);
    expect(result).toMatchObject({ added: 205, processedFiles: 205, completedBatches: batches.length });
  });
  it.each([file('trop-grand.zip', MAX_FILE_SIZE + 1), file('refuse.exe', 100), file('vide.pdf', 0)])('refuse un fichier invalide avant tout envoi : $name', async invalid => {
    const repo = repository();
    await expect(importDocumentFiles(repo, 'bien', [file('bon.pdf', 173 * mib), invalid], 'plans')).rejects.toThrow();
    expect(repo.addFiles).not.toHaveBeenCalled();
  });
  it('arrête les lots suivants après une erreur et garde les résultats confirmés pour la reprise', async () => {
    const files = [file('a.zip', 300 * mib), file('b.zip', 300 * mib), file('c.zip', 300 * mib)];
    const repo = { addFiles: vi.fn().mockResolvedValueOnce({ added: 0, duplicates: 1 }).mockRejectedValueOnce(Object.assign(new Error('Réseau interrompu'), { status: 503 })) };
    await expect(importDocumentFiles(repo, 'bien', files, 'autres')).rejects.toMatchObject({
      message: 'Envoi interrompu au lot 2 sur 3 : Réseau interrompu', status: 503,
      importProgress: { added: 0, duplicates: 1, processedFiles: 1, completedBatches: 1, totalFiles: 3 }
    });
    expect(repo.addFiles).toHaveBeenCalledTimes(2);
  });
});

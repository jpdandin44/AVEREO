import { MAX_BATCH_SIZE, MAX_FILES_PER_BATCH, validateFiles } from './document-store.js';

export function planDocumentImport(files) {
  const list = Array.from(files);
  if (!list.length) throw new Error('Choisissez au moins un fichier.');
  // Check every filename, extension and size before sending the first batch.
  for (const file of list) validateFiles([file]);
  const batches = [];
  let batch = [], bytes = 0;
  for (const file of list) {
    if (batch.length && (batch.length === MAX_FILES_PER_BATCH || bytes + file.size > MAX_BATCH_SIZE)) {
      batches.push(batch); batch = []; bytes = 0;
    }
    batch.push(file); bytes += file.size;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

export async function importDocumentFiles(repository, bienId, files, category, onProgress = () => {}) {
  const batches = planDocumentImport(files);
  const progress = { added: 0, duplicates: 0, processedFiles: 0, totalFiles: files.length, completedBatches: 0, totalBatches: batches.length };
  for (const [index, batch] of batches.entries()) {
    onProgress({ ...progress, currentBatch: index + 1 });
    try {
      const result = await repository.addFiles(bienId, batch, category);
      progress.added += result.added;
      progress.duplicates += result.duplicates;
      progress.processedFiles += batch.length;
      progress.completedBatches++;
    } catch (cause) {
      const error = new Error(`Envoi interrompu au lot ${index + 1} sur ${batches.length} : ${cause.message}`);
      error.status = cause.status;
      error.importProgress = { ...progress };
      throw error;
    }
  }
  return progress;
}

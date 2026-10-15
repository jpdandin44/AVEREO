import { SERVER_STORAGE, serverStorage } from './server-store.js';
export const CATEGORIES = {
  diagnostics: 'Diagnostics', plans: 'Plans et façades', urbanisme: 'Urbanisme',
  travaux: 'Devis et factures', juridique: 'Propriété et contrats', autres: 'Autres documents',
};
export const MAX_FILE_SIZE = 25 * 1024 * 1024;
export const MAX_BATCH_SIZE = 100 * 1024 * 1024;
const formats = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  txt: 'text/plain', csv: 'text/csv', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', odt: 'application/vnd.oasis.opendocument.text' };

export function validateFiles(files) {
  if (!files.length || files.length > 100) throw new Error('Choisir entre 1 et 100 fichiers.');
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_BATCH_SIZE) throw new Error('Ce lot dépasse 100 Mo. Importez les documents en plusieurs fois.');
  return files.map(file => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!formats[extension]) throw new Error(`Format non pris en charge : ${file.name}. Choisissez un PDF, une image ou un document bureautique.`);
    if (!file.size || file.size > MAX_FILE_SIZE) throw new Error(`Le fichier ${file.name} est vide ou dépasse 25 Mo.`);
    if (file.name.length > 255) throw new Error('Un nom de fichier dépasse 255 caractères.');
    return formats[extension];
  });
}

export function readBlob(blob) {
  if (blob.arrayBuffer) return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsArrayBuffer(blob);
  });
}
async function fingerprint(blob) {
  const digest = await crypto.subtle.digest('SHA-256', await readBlob(blob));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
const id = () => crypto.randomUUID();
const text = (value, max, label) => {
  const clean = typeof value === 'string' ? value.trim() : '';
  if (!clean || clean.length > max) throw new Error(`${label} requis (${max} caractères maximum).`);
  return clean;
};
const key = value => text(String(value ?? ''), 120, 'Identifiant du bien');

export function createDocumentRepository({ indexedDB = globalThis.indexedDB, name = 'avereo-passeport-immo-documents', hash = fingerprint } = {}) {
  let connection;
  function open() {
    if (!indexedDB) return Promise.reject(new Error('Le stockage local est indisponible dans ce navigateur.'));
    if (!connection) connection = new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('clients', { keyPath: 'id' });
        db.createObjectStore('biens', { keyPath: 'bienId' });
        const documents = db.createObjectStore('documents', { keyPath: 'id' });
        documents.createIndex('bien', 'bienId');
        documents.createIndex('contenu', ['bienId', 'sha256'], { unique: true });
        db.createObjectStore('files', { keyPath: 'id' });
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); connection = null; };
        resolve(db);
      };
      request.onerror = () => { connection = null; reject(request.error); };
      request.onblocked = () => { connection = null; reject(new Error('Fermez les autres onglets de Passeport Immo puis réessayez.')); };
    });
    return connection;
  }
  async function transaction(stores, mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      let result, failure;
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure || (tx.error?.name === 'QuotaExceededError'
        ? new Error('Le stockage du navigateur est plein. Aucun fichier de ce lot n’a été ajouté.')
        : tx.error || new Error('Enregistrement impossible. Aucun changement confirmé.')));
      const fail = error => { failure = error; tx.abort(); };
      try { operation(tx, value => { result = value; }, fail); }
      catch (error) { fail(error); }
    });
  }
  function load(bienId) {
    const bien = key(bienId);
    return transaction(['biens', 'clients', 'documents'], 'readonly', (tx, done) => {
      const result = { client: null, clients: [], documents: [] }; done(result);
      tx.objectStore('clients').getAll().onsuccess = e => { result.clients = e.target.result; };
      tx.objectStore('documents').index('bien').getAll(bien).onsuccess = e => { result.documents = e.target.result.sort((a,b) => b.addedAt.localeCompare(a.addedAt)); };
      tx.objectStore('biens').get(bien).onsuccess = e => {
        if (e.target.result) tx.objectStore('clients').get(e.target.result.clientId).onsuccess = event => { result.client = event.target.result || null; };
      };
    });
  }
  async function linkClient(bienId, { clientId, name: clientName }) {
    const bien = key(bienId);
    const newClient = clientId ? null : { id: id(), name: text(clientName, 160, 'Nom du client'), createdAt: new Date().toISOString() };
    return transaction(['clients', 'biens', 'documents'], 'readwrite', (tx, done, fail) => {
      const clients = tx.objectStore('clients');
      if (newClient) clients.add(newClient);
      clients.get(clientId || newClient.id).onsuccess = e => {
        if (!e.target.result) return fail(new Error('Client introuvable.'));
        // A dossier containing documents cannot silently change its owner.
        tx.objectStore('biens').get(bien).onsuccess = event => {
          const previous = event.target.result;
          tx.objectStore('documents').index('bien').count(bien).onsuccess = count => {
            if (previous && previous.clientId !== e.target.result.id && count.target.result) return fail(new Error('Ce dossier contient des documents. Son client ne peut pas être remplacé.'));
            tx.objectStore('biens').put({ bienId: bien, clientId: e.target.result.id }); done(e.target.result);
          };
        };
      };
    });
  }
  async function addFiles(bienId, files, category = 'autres') {
    const bien = key(bienId), list = Array.from(files);
    const types = validateFiles(list);
    if (!CATEGORIES[category]) throw new Error('Catégorie inconnue.');
    // Hashing happens before the write transaction, which remains atomic.
    const prepared = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i], bytes = await readBlob(file);
      if (types[i] === 'application/pdf' && String.fromCharCode(...new Uint8Array(bytes.slice(0, 5))) !== '%PDF-') throw new Error(`${file.name} n’est pas un PDF lisible.`);
      prepared.push({ file: new Blob([bytes], { type: types[i] }), sha256: await hash(new Blob([bytes])), name: file.name, mime: types[i], size: file.size });
    }
    return transaction(['biens', 'documents', 'files'], 'readwrite', (tx, done, fail) => {
      const result = { added: 0, duplicates: 0 }; done(result);
      tx.objectStore('biens').get(bien).onsuccess = e => {
        if (!e.target.result) return fail(new Error('Associez d’abord un client à ce bien.'));
        const clientId = e.target.result.clientId, documents = tx.objectStore('documents'), content = documents.index('contenu');
        // Process sequentially to deduplicate within a batch and across concurrent imports.
        function next(index) {
          if (index === prepared.length) return;
          const item = prepared[index];
          content.getKey([bien, item.sha256]).onsuccess = event => {
            if (event.target.result) { result.duplicates++; next(index+1); return; }
            const documentId = id(), now = new Date().toISOString();
            documents.add({ id: documentId, bienId: bien, clientId, name: item.name, title: item.name.replace(/\.[^.]+$/, '').slice(0, 200), category, mime: item.mime, size: item.size, sha256: item.sha256, addedAt: now, updatedAt: now, archivedAt: null });
            tx.objectStore('files').add({ id: documentId, blob: item.file }).onsuccess = () => { result.added++; next(index+1); };
          };
        }
        next(0);
      };
    });
  }
  function updateDocument(bienId, documentId, { title, category, archived }) {
    const bien = key(bienId), titleValue = text(title, 200, 'Titre');
    if (!CATEGORIES[category]) return Promise.reject(new Error('Catégorie inconnue.'));
    return transaction(['documents'], 'readwrite', (tx, done, fail) => {
      const store = tx.objectStore('documents');
      store.get(documentId).onsuccess = e => {
        const doc = e.target.result;
        if (!doc || doc.bienId !== bien) return fail(new Error('Document introuvable dans ce bien.'));
        const now = new Date().toISOString();
        const updated = { ...doc, title: titleValue, category, updatedAt: now, archivedAt: archived ? (doc.archivedAt || now) : null };
        store.put(updated); done(updated);
      };
    });
  }
  function getFile(bienId, documentId) {
    const bien = key(bienId);
    return transaction(['documents', 'files'], 'readonly', (tx, done, fail) => {
      tx.objectStore('documents').get(documentId).onsuccess = e => {
        if (!e.target.result || e.target.result.bienId !== bien) return fail(new Error('Document introuvable dans ce bien.'));
        tx.objectStore('files').get(documentId).onsuccess = event => {
          if (!event.target.result) return fail(new Error('Fichier indisponible. Réimportez la copie source.'));
          done(event.target.result.blob);
        };
      };
    });
  }
  return { load, linkClient, addFiles, updateDocument, getFile, close: async () => { if (connection) (await connection).close(); connection = null; } };
}

export const documentRepository = SERVER_STORAGE ? serverStorage.repository : createDocumentRepository();

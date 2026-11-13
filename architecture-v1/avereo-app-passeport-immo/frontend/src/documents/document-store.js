import { SERVER_STORAGE, serverStorage } from './server-store.js';
import { documentSettings, validateDocumentSettings } from './document-settings.js';
export const CATEGORIES = {
  diagnostics: 'Diagnostics', plans: 'Plans et façades', urbanisme: 'Urbanisme',
  travaux: 'Devis et factures', juridique: 'Propriété et contrats', autres: 'Autres documents',
};
export const MAX_FILE_SIZE = 500 * 1024 * 1024;
export const MAX_BATCH_SIZE = 500 * 1024 * 1024;
export const MAX_FILES_PER_BATCH = 100;
const archiveFormats = { zip: 'application/zip', '7z': 'application/x-7z-compressed', rar: 'application/vnd.rar',
  tar: 'application/x-tar', gz: 'application/gzip', tgz: 'application/gzip' };
const formats = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  txt: 'text/plain', csv: 'text/csv', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', odt: 'application/vnd.oasis.opendocument.text', ...archiveFormats };
export const DOCUMENT_ACCEPT = Object.keys(formats).map(extension => `.${extension}`).join(',');
export const isCompressedArchive = document => Object.values(archiveFormats).includes(document.mime);

function checkArchiveSignature(file, buffer) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (!archiveFormats[extension]) return;
  const bytes = new Uint8Array(buffer);
  const starts = signature => signature.every((value, index) => bytes[index] === value);
  const valid = extension === 'zip' ? bytes.length >= 22 && [[0x50,0x4b,3,4],[0x50,0x4b,5,6],[0x50,0x4b,7,8]].some(starts)
    : extension === '7z' ? bytes.length >= 32 && starts([0x37,0x7a,0xbc,0xaf,0x27,0x1c])
    : extension === 'rar' ? bytes.length >= 14 && (starts([0x52,0x61,0x72,0x21,0x1a,7,0]) || starts([0x52,0x61,0x72,0x21,0x1a,7,1,0]))
    : extension === 'tar' ? bytes.length >= 512 && String.fromCharCode(...bytes.slice(257,262)) === 'ustar'
    : bytes.length >= 18 && starts([0x1f,0x8b,8]);
  // Identify the container only. Never extract or execute uploaded content.
  if (!valid) throw new Error(`Le fichier ${file.name} ne correspond pas au format d’archive annoncé.`);
}

export function validateFiles(files) {
  if (!files.length || files.length > MAX_FILES_PER_BATCH) throw new Error('Choisir entre 1 et 100 fichiers par lot.');
  const types = files.map(file => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!formats[extension]) throw new Error(`Format non pris en charge : ${file.name}. Choisissez un PDF, une image, un document bureautique ou une archive ZIP, 7z, RAR, TAR, GZ ou TGZ.`);
    if (!file.size || file.size > MAX_FILE_SIZE) throw new Error(`Le fichier ${file.name} est vide ou dépasse 500 Mo. Chaque fichier doit rester entier et inférieur à cette limite.`);
    if (file.name.length > 255) throw new Error('Un nom de fichier dépasse 255 caractères.');
    return formats[extension];
  });
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_BATCH_SIZE) throw new Error('Ce lot dépasse 500 Mo. Les documents doivent être répartis en plusieurs lots.');
  return types;
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
      const result = { client: null, clients: [], documents: [], settings: documentSettings() }; done(result);
      tx.objectStore('clients').getAll().onsuccess = e => { result.clients = e.target.result; };
      tx.objectStore('documents').index('bien').getAll(bien).onsuccess = e => { result.documents = e.target.result.sort((a,b) => b.addedAt.localeCompare(a.addedAt)); };
      tx.objectStore('biens').get(bien).onsuccess = e => {
        if (e.target.result) {
          result.settings = documentSettings(e.target.result.settings);
          tx.objectStore('clients').get(e.target.result.clientId).onsuccess = event => { result.client = event.target.result || null; };
        }
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
            tx.objectStore('biens').put({ ...previous, bienId: bien, clientId: e.target.result.id }); done(e.target.result);
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
      checkArchiveSignature(file, bytes);
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
          content.get([bien, item.sha256]).onsuccess = event => {
            if (event.target.result?.trashedAt) return fail(new Error(`${item.name} est dans la corbeille. Restaurez-le ou supprimez-le définitivement avant de le réimporter.`));
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
    return transaction(['documents', 'biens'], 'readwrite', (tx, done, fail) => {
      const store = tx.objectStore('documents');
      store.get(documentId).onsuccess = e => {
        const doc = e.target.result;
        if (!doc || doc.bienId !== bien) return fail(new Error('Document introuvable dans ce bien.'));
        if (doc.trashedAt) return fail(new Error('Restaurez le document avant de le modifier.'));
        const now = new Date().toISOString();
        const updated = { ...doc, title: titleValue, category, updatedAt: now, archivedAt: archived ? (doc.archivedAt || now) : null };
        store.put(updated);
        if (doc.category !== category) tx.objectStore('biens').get(bien).onsuccess = event => {
          const property = event.target.result, settings = documentSettings(property.settings);
          settings.order = Object.fromEntries(Object.entries(settings.order).map(([key, ids]) => [key, ids.filter(id => id !== documentId)]));
          settings.revision++; tx.objectStore('biens').put({ ...property, settings });
        };
        done(updated);
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
  function trashState(bienId, documentId, trashed) {
    const bien = key(bienId);
    return transaction(['documents'], 'readwrite', (tx, done, fail) => {
      const store = tx.objectStore('documents');
      store.get(documentId).onsuccess = e => {
        const doc = e.target.result;
        if (!doc || doc.bienId !== bien) return fail(new Error('Document introuvable dans ce bien.'));
        const now = new Date().toISOString();
        const updated = { ...doc, trashedAt: trashed ? (doc.trashedAt || now) : null, updatedAt: now };
        store.put(updated); done(updated);
      };
    });
  }
  function deleteDocument(bienId, documentId) {
    const bien = key(bienId);
    return transaction(['documents', 'files', 'biens'], 'readwrite', (tx, done, fail) => {
      tx.objectStore('documents').get(documentId).onsuccess = e => {
        const doc = e.target.result;
        if (!doc || doc.bienId !== bien) return fail(new Error('Document introuvable dans ce bien.'));
        if (!doc.trashedAt) return fail(new Error('Placez le document dans la corbeille avant de le supprimer définitivement.'));
        tx.objectStore('documents').delete(documentId); tx.objectStore('files').delete(documentId);
        tx.objectStore('biens').get(bien).onsuccess = event => {
          const property = event.target.result, settings = documentSettings(property.settings);
          settings.order = Object.fromEntries(Object.entries(settings.order).map(([category, ids]) => [category, ids.filter(id => id !== documentId)]));
          settings.revision++; tx.objectStore('biens').put({ ...property, settings }); done({ deleted: true, id: documentId });
        };
      };
    });
  }
  function saveDocumentSettings(bienId, value) {
    const bien = key(bienId);
    return transaction(['biens', 'documents'], 'readwrite', (tx, done, fail) => {
      tx.objectStore('biens').get(bien).onsuccess = e => {
        const property = e.target.result;
        if (!property) return fail(new Error('Associez d’abord le client à ce bien.'));
        if (documentSettings(property.settings).revision !== value.revision) return fail(new Error('L’organisation a changé dans une autre fenêtre. Rouvrez le bien avant de poursuivre.'));
        tx.objectStore('documents').index('bien').getAll(bien).onsuccess = event => {
          try {
            const settings = validateDocumentSettings(value, event.target.result);
            settings.revision++; tx.objectStore('biens').put({ ...property, settings }); done(settings);
          } catch (error) { fail(error); }
        };
      };
    });
  }
  return { load, linkClient, addFiles, updateDocument, getFile, trashDocument: (bien, doc) => trashState(bien, doc, true),
    restoreDocument: (bien, doc) => trashState(bien, doc, false), deleteDocument, saveDocumentSettings,
    close: async () => { if (connection) (await connection).close(); connection = null; } };
}

export const documentRepository = SERVER_STORAGE ? serverStorage.repository : createDocumentRepository();

export const SERVER_STORAGE = typeof document !== 'undefined'
  && document.querySelector('meta[name="passeport-storage"]')?.content === 'server';

export function createServerStorage({ fetcher = (...args) => fetch(...args), notify = () => {} } = {}) {
  let csrf = null, revision = null, latest = null, pending = null, failure = null;
  async function request(path, options = {}) {
    const headers = { ...options.headers };
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (options.method && options.method !== 'GET') headers['X-Passeport-CSRF'] = csrf;
    const response = await fetcher(`/api${path}`, { credentials: 'same-origin', cache: 'no-store', ...options, headers });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(body.error || `Le serveur a refusé la demande (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return options.blob ? response.blob() : response.json();
  }
  async function load() {
    const session = await request('/session'); csrf = session.csrf;
    const workspace = await request('/workspace'); revision = workspace.revision;
    return { ...workspace, user: session.user };
  }
  async function drain() {
    try {
      while (latest) {
        const snapshot = latest; latest = null;
        const result = await request('/workspace', { method: 'PUT', body: JSON.stringify({ ...snapshot, revision }) });
        revision = result.revision;
      }
      failure = null; notify({ saving: false, error: null });
    } catch (error) {
      failure = error; notify({ saving: false, error: error.message }); throw error;
    } finally { pending = null; }
  }
  function save(snapshot) {
    latest = snapshot;
    if (failure) return;
    notify({ saving: true, error: null });
    if (!pending) {
      // A microtask ensures pending is assigned even when a test fetcher throws immediately.
      pending = Promise.resolve().then(drain);
      pending.catch(() => {});
    }
  }
  async function flush() { if (pending) await pending; if (failure) throw failure; }
  const bienPath = id => `/biens/${encodeURIComponent(String(id))}`;
  const repository = {
    server: true,
    async load(id) { await flush(); return request(`${bienPath(id)}/documents`); },
    async linkClient(id, client) { await flush(); return request(`${bienPath(id)}/client`, { method: 'POST', body: JSON.stringify(client) }); },
    async addFiles(id, files, category) {
      await flush(); const body = new FormData(); body.append('category', category); body.append('expectedCount', String(files.length));
      for (const file of files) body.append('files[]', file, file.name);
      return request(`${bienPath(id)}/documents`, { method: 'POST', body });
    },
    async updateDocument(id, doc, patch) { await flush(); return request(`${bienPath(id)}/documents/${encodeURIComponent(doc)}`, { method: 'PATCH', body: JSON.stringify(patch) }); },
    async getFile(id, doc) { await flush(); return request(`${bienPath(id)}/documents/${encodeURIComponent(doc)}/file`, { blob: true }); },
    close() {},
  };
  return { load, save, flush, repository };
}

let updateStatus = () => {};
export const serverStorage = createServerStorage({ notify: status => updateStatus(status) });
export function persistLocal(key, value) { if (!SERVER_STORAGE) localStorage.setItem(key, value); }

export function attachServerStorage(store) {
  if (!SERVER_STORAGE) return;
  updateStatus = ({ saving, error }) => store.setState({ storageSaving: saving, storageError: error });
  store.subscribe((state, previous) => {
    if (state.storageReady && previous.storageReady
      && (state.biens !== previous.biens || state.tarifs !== previous.tarifs)) {
      serverStorage.save({ biens: state.biens, tarifs: state.tarifs });
    }
  });
  window.addEventListener('beforeunload', event => {
    const { storageSaving, storageError } = store.getState();
    if (storageSaving || storageError) { event.preventDefault(); event.returnValue = ''; }
  });
}

let hydration;
export function hydrateServer(store, initialTarifs) {
  hydration ??= serverStorage.load().then(({ biens, tarifs, user }) => {
    store.setState({ biens, tarifs: { ...initialTarifs, ...tarifs }, user, isAuthenticated: true,
      isLoading: false, storageReady: true, storageSaving: false, storageError: null });
  }).catch(error => store.setState({ isLoading: false, storageError: error.message }));
  return hydration;
}

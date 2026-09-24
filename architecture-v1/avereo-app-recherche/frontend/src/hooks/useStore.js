import { create } from 'zustand';
import { OWNER } from '../config/referentiels.js';
import { DEMO_RESOURCES } from '../data/demo.js';
import { normalizeResource } from '../services/resource.js';
import { loadState, saveState } from '../services/storage.js';
import { norm, todayISO } from '../utils/text.js';

const EMPTY_LOG = { zeroResults: [], notUseful: [], copies: {}, suggestions: [] };
const dedupeKey = r => `${norm(r.title)}|${norm(r.src.url)}`;

let toastTimer = null;

export const useStore = create((set, get) => ({
  loaded: false,
  resources: [],
  basket: [],
  format: 'short',
  log: EMPTY_LOG,
  toast: null,

  hydrate: async () => {
    const saved = await loadState();
    set({
      loaded: true,
      resources: (saved?.resources || []).map(normalizeResource),
      basket: saved?.basket || [],
      format: saved?.format || 'short',
      log: { ...EMPTY_LOG, ...(saved?.log || {}) },
    });
  },

  showToast: message => {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 2400);
  },

  upsertResource: raw => {
    const r = normalizeResource({ ...raw, updatedAt: new Date().toISOString() });
    set(s => ({
      resources: s.resources.some(x => x.id === r.id)
        ? s.resources.map(x => (x.id === r.id ? r : x))
        : [r, ...s.resources],
    }));
    return r;
  },

  deleteResource: id => set(s => ({
    resources: s.resources.filter(r => r.id !== id),
    basket: s.basket.filter(b => b !== id),
  })),

  importResources: list => {
    const existingIds = new Set(get().resources.map(r => r.id));
    const existingKeys = new Set(get().resources.map(dedupeKey));
    const added = [];
    let skipped = 0;
    for (const raw of list) {
      const r = normalizeResource(raw);
      const key = dedupeKey(r);
      if (existingIds.has(r.id) || existingKeys.has(key)) { skipped++; continue; }
      existingIds.add(r.id); existingKeys.add(key);
      added.push(r);
    }
    set(s => ({ resources: [...added, ...s.resources] }));
    return { added: added.length, skipped };
  },

  loadDemo: () => get().importResources(DEMO_RESOURCES),
  removeDemo: () => set(s => {
    const demoIds = new Set(s.resources.filter(r => r.demo).map(r => r.id));
    return { resources: s.resources.filter(r => !r.demo), basket: s.basket.filter(id => !demoIds.has(id)) };
  }),

  toggleBasket: id => set(s => ({ basket: s.basket.includes(id) ? s.basket.filter(b => b !== id) : [...s.basket, id] })),
  clearBasket: () => set({ basket: [] }),
  setFormat: format => set({ format }),

  // Circuit de validation (note 04, § 7)
  requestReview: id => set(s => ({
    resources: s.resources.map(r => (r.id === id ? { ...r, client: 'ELIGIBLE_FOR_REVIEW', updatedAt: new Date().toISOString() } : r)),
  })),
  decide: (id, decision, note = '', evidence = '') => set(s => ({
    resources: s.resources.map(r => (r.id === id ? {
      ...r,
      client: decision,
      validation: { decision, by: OWNER.label, role: OWNER.role, at: todayISO(), note: note.trim(), evidence: evidence.trim() },
      updatedAt: new Date().toISOString(),
    } : r)),
  })),

  // Journal d'usage (note 04, § 9) — aucun secret, aucune donnée client
  logZeroResult: q => set(s => {
    const last = s.log.zeroResults[0];
    if (last && norm(last.q) === norm(q)) return {};
    return { log: { ...s.log, zeroResults: [{ q, at: new Date().toISOString() }, ...s.log.zeroResults].slice(0, 200) } };
  }),
  logNotUseful: (id, q) => set(s => ({ log: { ...s.log, notUseful: [{ id, q, at: new Date().toISOString() }, ...s.log.notUseful].slice(0, 200) } })),
  logCopy: ids => set(s => {
    const copies = { ...s.log.copies };
    for (const id of [].concat(ids)) copies[id] = (copies[id] || 0) + 1;
    return { log: { ...s.log, copies } };
  }),
  addSuggestion: text => set(s => ({ log: { ...s.log, suggestions: [{ text: text.trim(), at: new Date().toISOString() }, ...s.log.suggestions] } })),
  removeSuggestion: at => set(s => ({ log: { ...s.log, suggestions: s.log.suggestions.filter(x => x.at !== at) } })),
  clearUsageLog: () => set(s => ({ log: { ...EMPTY_LOG, suggestions: s.log.suggestions } })),

  restoreBackup: ({ resources, log }) => set({
    resources: resources.map(normalizeResource),
    log: { ...EMPTY_LOG, ...(log || {}) },
    basket: [],
  }),
}));

// Enregistrement automatique dans le navigateur après chaque changement
useStore.subscribe(s => {
  if (!s.loaded) return;
  saveState({ resources: s.resources, basket: s.basket, format: s.format, log: s.log });
});

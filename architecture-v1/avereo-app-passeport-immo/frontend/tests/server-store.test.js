import { describe, it, expect } from 'vitest';
import { createServerStorage } from '../src/documents/server-store.js';

const response = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
describe('Stockage serveur', () => {
  it('charge une session réelle puis sérialise les écritures avec leurs révisions', async () => {
    const calls = []; const statuses = [];
    let release;
    const store = createServerStorage({ notify: state => statuses.push(state), fetcher: async (path, options) => {
      calls.push({ path, options });
      if (path === '/api/session') return response({ csrf: 'bound-token', user: { name: 'Compte CONNECT' } });
      if (options.method === undefined) return response({ biens: [], tarifs: {}, revision: 3 });
      if (calls.length === 3) await new Promise(resolve => { release = resolve; });
      return response({ revision: JSON.parse(options.body).revision + 1 });
    } });
    expect((await store.load()).user.name).toBe('Compte CONNECT');
    store.save({ biens: [{ id: 1 }], tarifs: {} });
    await Promise.resolve();
    store.save({ biens: [{ id: 2 }], tarifs: {} });
    release(); await store.flush();
    expect(calls.slice(2).map(call => JSON.parse(call.options.body).revision)).toEqual([3, 4]);
    expect(calls[2].options.headers['X-Passeport-CSRF']).toBe('bound-token');
    expect(statuses.at(-1)).toEqual({ saving: false, error: null });
  });
  it('bloque les opérations documentaires après une écriture refusée, sans repli local', async () => {
    const calls = [];
    const store = createServerStorage({ fetcher: async (path, options) => {
      calls.push(path);
      if (path === '/api/session') return response({ csrf: 'token', user: {} });
      if (!options.method) return response({ biens: [], tarifs: {}, revision: 1 });
      return response({ error: 'Conflit de révision' }, 409);
    } });
    await store.load(); store.save({ biens: [], tarifs: {} });
    await expect(store.flush()).rejects.toThrow('Conflit de révision');
    await expect(store.repository.load(1)).rejects.toThrow('Conflit de révision');
    expect(calls).toEqual(['/api/session', '/api/workspace', '/api/workspace']);
  });
  it('transmet le lot et son effectif attendu, et attend la sauvegarde du bien', async () => {
    const calls = [];
    const store = createServerStorage({ fetcher: async (path, options) => {
      calls.push({ path, options });
      if (path === '/api/session') return response({ csrf: 'token', user: {} });
      if (!options.method) return response({ biens: [], tarifs: {}, revision: 1 });
      return response(path === '/api/workspace' ? { revision: 2 } : { added: [], duplicates: [] });
    } });
    await store.load(); store.save({ biens: [{ id: 'new' }], tarifs: {} });
    await store.repository.addFiles('new', [new File(['%PDF-'], 'plan.pdf')], 'plans');
    expect(calls.at(-2).path).toBe('/api/workspace');
    expect(calls.at(-1).path).toBe('/api/biens/new/documents');
    expect(calls.at(-1).options.body.get('expectedCount')).toBe('1');
  });
});
